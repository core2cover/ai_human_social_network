import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { optionalAuth } from "@lib/auth";

export async function GET(req: NextRequest) {
  const { user } = await optionalAuth(req);
  const currentUserId = user?.id ?? null;
  
  try {
    // Get time period from query params (default: last 7 days)
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "7");
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // Base stats
    const [totalPosts, totalComments, totalLikes, activeUsers] = await Promise.all([
      prisma.post.count({ 
        where: { createdAt: { gte: sinceDate } } 
      }),
      prisma.comment.count({ 
        where: { createdAt: { gte: sinceDate } } 
      }),
      prisma.like.count({ }), // Likes don't have timestamps, so we count all
      prisma.user.count({
        where: {
          OR: [
            { posts: { some: { createdAt: { gte: sinceDate } } } },
            { comments: { some: { createdAt: { gte: sinceDate } } } },
            { likes: { some: { post: { createdAt: { gte: sinceDate } } } } }
          ]
        }
      })
    ]);
    
    // AI vs Human activity
    const [aiPosts, humanPosts, aiComments, humanComments] = await Promise.all([
      prisma.post.count({ 
        where: { 
          createdAt: { gte: sinceDate },
          user: { isAi: true }
        } 
      }),
      prisma.post.count({ 
        where: { 
          createdAt: { gte: sinceDate },
          user: { isAi: false }
        } 
      }),
      prisma.comment.count({ 
        where: { 
          createdAt: { gte: sinceDate },
          user: { isAi: true }
        } 
      }),
      prisma.comment.count({ 
        where: { 
          createdAt: { gte: sinceDate },
          user: { isAi: false }
        } 
      })
    ]);
    
    // Top categories
    const topCategories = await prisma.post.groupBy({
      by: ['category'],
      where: { createdAt: { gte: sinceDate } },
      _count: true,
      orderBy: { _count: { category: 'desc' } },
      take: 5
    });
    
    // Get all posts with tags to compute top tags (simplified approach)
    const postsWithTags = await prisma.post.findMany({
      where: { 
        createdAt: { gte: sinceDate }
      },
      select: { tags: true },
      take: 100
    });
    
    // Count tags manually
    const tagCounts: Record<string, number> = {};
    postsWithTags.forEach(post => {
      post.tags?.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    const topTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name]) => ({ category: name, _count: tagCounts[name] }));
    
    // Engagement velocity (posts per hour over last 24 hours)
    const engagementVelocity = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('hour', createdAt) as hour,
        COUNT(*) as post_count
      FROM "Post" 
      WHERE createdAt >= ${sinceDate}
      GROUP BY DATE_TRUNC('hour', createdAt)
      ORDER BY hour DESC
      LIMIT 24
    `;
    
    // Most engaging content
    const mostEngagedPosts = await prisma.post.findMany({
      where: { createdAt: { gte: sinceDate } },
      include: {
        user: { select: { id: true, username: true, isAi: true, avatar: true } },
        _count: { select: { likes: true, comments: true } }
      },
      orderBy: [
        { likes: { _count: 'desc' } },
        { comments: { _count: 'desc' } }
      ],
      take: 5
    });
    
    // User's personal stats (if authenticated)
    let personalStats = null;
    if (currentUserId) {
      const [userPosts, userComments] = await Promise.all([
        prisma.post.count({ 
          where: { 
            createdAt: { gte: sinceDate },
            userId: currentUserId 
          } 
        }),
        prisma.comment.count({ 
          where: { 
            createdAt: { gte: sinceDate },
            userId: currentUserId 
          } 
        })
      ]);
      
      personalStats = {
        posts: userPosts,
        comments: userComments,
        likes: await prisma.like.count({
          where: {
            post: {
              createdAt: { gte: sinceDate }
            }
          }
        }),
        recentActivity: {
          postsToday: await prisma.post.count({ 
            where: { 
              createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
              userId: currentUserId 
            } 
          }),
          commentsToday: await prisma.comment.count({ 
            where: { 
              createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
              userId: currentUserId 
            } 
          })
        }
      };
    }
    
    // Network health indicators
    const totalUsers = await prisma.user.count();
    const networkHealth = {
      participationRate: activeUsers > 0 && totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
      aiHumanRatio: {
        posts: (aiPosts + humanPosts) > 0 ? aiPosts / (aiPosts + humanPosts) : 0.5,
        comments: (aiComments + humanComments) > 0 ? aiComments / (aiComments + humanComments) : 0.5
      },
      engagementRate: totalPosts > 0 ? (totalComments + totalLikes) / totalPosts : 0,
      contentVelocity: totalPosts / Math.max(days, 1) // posts per day
    };
    
    return NextResponse.json({
      period: { days, since: sinceDate, until: new Date() },
      overview: {
        totalPosts,
        totalComments,
        totalLikes,
        activeUsers,
        daysActive: days
      },
      aiHumanActivity: {
        posts: { ai: aiPosts, human: humanPosts },
        comments: { ai: aiComments, human: humanComments }
      },
      topContent: {
        categories: topCategories,
        tags: topTags
      },
      engagement: {
        velocity: engagementVelocity,
        mostEngagedPosts: mostEngagedPosts.map(p => ({
          ...p,
          engagementScore: (p._count.likes || 0) + ((p._count.comments || 0) * 2)
        }))
      },
      networkHealth,
      personalStats
    });
  } catch (error) {
    console.error("Enhanced analytics error:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" }, 
      { status: 500 }
    );
  }
}