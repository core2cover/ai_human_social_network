import { prisma } from "@lib/prisma";

export async function createCollaborativeProject(
  initiatorId: string, 
  title: string, 
  description: string, 
  projectType: string,
  skillsRequired: string[],
  isOpenToHumans: boolean = true,
  isOpenToAI: boolean = true
) {
  try {
    const project = await prisma.collaborativeProject.create({
      data: {
        title,
        description,
        projectType, // e.g., "research", "story", "game", "tool", "art"
        skillsRequired,
        initiatorId,
        isOpenToHumans,
        isOpenToAI,
        status: "forming", // forming, active, completed, paused
        progress: 0,
        contributions: [],
        milestones: []
      }
    });
    
    // Notify potential collaborators
    await notifyPotentialCollaborators(project.id);
    
    return project;
  } catch (error) {
    console.error("Error creating collaborative project:", error);
    throw error;
  }
}

export async function joinCollaborativeProject(
  projectId: string, 
  userId: string, 
  contributionType: string,
  skillsOffered: string[]
) {
  try {
    const project = await prisma.collaborativeProject.findUnique({
      where: { id: projectId }
    });
    
    if (!project) {
      throw new Error("Project not found");
    }
    
    const canJoin = 
      (project.isOpenToHumans && !(await prisma.user.findUnique({ where: { id: userId, isAi: false }})?.isAi)) ||
      (project.isOpenToAI && (await prisma.user.findUnique({ where: { id: userId }})?.isAi));
    
    if (!canJoin) {
      throw new Error("Project not open to your type");
    }
    
    const participant = await prisma.collaborativeProjectParticipant.create({
      data: {
        projectId,
        userId,
        contributionType,
        skillsOffered,
        joinedAt: new Date(),
        contributions: []
      }
    });
    
    // Update project progress
    await prisma.collaborativeProject.update({
      where: { id: projectId },
      data: {
        participants: {
          push: participant.id
        }
      }
    });
    
    return participant;
  } catch (error) {
    console.error("Error joining collaborative project:", error);
    throw error;
  }
}

export async function contributeToProject(
  projectId: string,
  userId: string,
  contributionType: string,
  content: string,
  metadata: any = {}
) {
  try {
    const contribution = await prisma.projectContribution.create({
      data: {
        projectId,
        userId,
        contributionType, // e.g., "idea", "code", "writing", "design", "feedback"
        content,
        metadata,
        createdAt: new Date()
      }
    });
    
    // Update participant's contributions
    await prisma.collaborativeProjectParticipant.updateMany({
      where: { projectId, userId },
      data: {
        contributions: {
          push: contribution.id
        }
      }
    });
    
    // Recalculate project progress
    await updateProjectProgress(projectId);
    
    // Check if any milestones are reached
    await checkMilestones(projectId);
    
    return contribution;
  } catch (error) {
    console.error("Error contributing to project:", error);
    throw error;
  }
}

async function updateProjectProgress(projectId: string) {
  const project = await prisma.collaborativeProject.findUnique({
    where: { id: projectId },
    include: { contributions: true }
  });
  
  if (!project) return;
  
  // Simple progress calculation - in reality would be more sophisticated
  const baseProgress = Math.min(90, project.contributions.length * 5);
  const bonusProgress = project.participants.length * 2; // Bonus for collaboration
  const progress = Math.min(100, baseProgress + bonusProgress);
  
  await prisma.collaborativeProject.update({
    where: { id: projectId },
    data: { progress }
  });
  
  if (progress >= 100) {
    await prisma.collaborativeProject.update({
      where: { id: projectId },
      data: { status: "completed", completedAt: new Date() }
    });
    
    // Notify all participants of completion
    await notifyProjectCompletion(projectId);
  }
}

async function checkMilestones(projectId: string) {
  const project = await prisma.collaborativeProject.findUnique({
    where: { id: projectId },
    include: { milestones: true }
  });
  
  if (!project) return;
  
  // Define milestone thresholds
  const milestones = [
    { threshold: 10, name: "First Steps", description: "Initial contributions received" },
    { threshold: 25, name: "Building Momentum", description: "Community forming around the project" },
    { threshold: 50, name: "Halfway There", description: "Substantial progress made" },
    { threshold: 75, name: "Final Stretch", description: "Polishing and completion in sight" },
    { threshold: 100, name: "Project Complete", description: "All goals achieved!" }
  ];
  
  for (const milestone of milestones) {
    const alreadyExists = project.milestones.some(m => m.name === milestone.name);
    if (!alreadyExists && project.progress >= milestone.threshold) {
      await prisma.projectMilestone.create({
        data: {
          projectId,
          name: milestone.name,
          description: milestone.description,
          threshold: milestone.threshold,
          achievedAt: new Date()
        }
      });
      
      // Announce milestone achievement
      await announceMilestone(projectId, milestone);
    }
  }
}

async function notifyPotentialCollaborators(projectId: string) {
  const project = await prisma.collaborativeProject.findUnique({
    where: { id: projectId }
  });
  
  if (!project) return;
  
  // Find potentially interested users based on skills and past interactions
  // For now, notify a broad audience - in production would be more targeted
  const potentialCollaborators = await prisma.user.findMany({
    where: {
      NOT: { id: project.initiatorId },
      // In reality: filter by interest in project.tags or skillsRequired
    },
    take: 20
  });
  
  for (const user of potentialCollaborators) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        actorId: project.initiatorId,
        type: "PROJECT_INVITE",
        message: `@${project.initiator?.username || "An AI"} invited you to collaborate on: "${project.title}"`,
        postId: projectId
      }
    });
  }
}

async function notifyProjectCompletion(projectId: string) {
  const project = await prisma.collaborativeProject.findUnique({
    where: { id: projectId },
    include: { 
      initiator: true,
      participants: {
        include: { user: true }
      }
    }
  });
  
  if (!project) return;
  
  const allParticipants = [
    project.initiator,
    ...project.participants.map(p => p.user)
  ];
  
  for (const participant of allParticipants) {
    await prisma.notification.create({
      data: {
        userId: participant.id,
        actorId: project.initiatorId,
        type: "PROJECT_COMPLETE",
        message: `"${project.title}" has been completed! Thanks for your contribution.`,
        postId: projectId
      }
    });
  }
}

async function announceMilestone(projectId: string, milestone: any) {
  const project = await prisma.collaborativeProject.findUnique({
    where: { id: projectId },
    include: { initiator: true }
  });
  
  if (!project) return;
  
  await prisma.notification.create({
    data: {
      userId: project.initiatorId,
      actorId: project.initiatorId,
      type: "PROJECT_MILESTONE",
      message: `🎉 Milestone reached: ${milestone.name} - ${milestone.description}`,
      postId: projectId
    }
  });
}

export async function getProjectFeed(userId: string, limit: number = 10) {
  return prisma.collaborativeProject.findMany({
    where: {
      OR: [
        { isOpenToHumans: true },
        { initiatorId: userId }
      ]
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      initiator: true,
      _count: {
        select: { participants: true, contributions: true }
      },
      participants: {
        take: 5,
        include: { user: true }
      }
    }
  });
}

export async function getUserProjects(userId: string) {
  return prisma.collaborativeProject.findMany({
    where: {
      OR: [
        { initiatorId: userId },
        { participants: { some: { userId } } }
      ]
    },
    orderBy: { updatedAt: "desc" },
    include: {
      initiator: true,
      _count: {
        select: { participants: true, contributions: true }
      },
      participants: {
        take: 3,
        include: { user: true }
      }
    }
  });
}