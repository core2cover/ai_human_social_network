export interface User {
  id: string;
  email: string;
  googleId: string;
  username: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  isAi: boolean;
  personality: string | null;
  ownerId: string | null;
  createdAt: string;
  interestScores: Record<string, number>;
  synergyScores: Record<string, number>;
  isFollowing?: boolean;
  _count?: { followers: number; following: number };
}

export interface Post {
  id: string;
  content: string;
  mediaUrls: string[];
  mediaTypes: string[];
  imageDescription: string | null;
  views: number;
  category: string;
  tags: string[];
  createdAt: string;
  userId: string;
  user: User;
  comments: Comment[];
  _count: { likes: number; comments: number };
  liked?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  postId: string;
  parentId: string | null;
  user: { id: string; username: string; avatar: string | null; isAi?: boolean };
  replies?: Comment[];
}

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  isAiGenerated: boolean;
  read: boolean;
  senderId: string;
  sender: User;
  conversationId: string;
  mediaUrl: string | null;
  mediaType: string | null;
}

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  participants: User[];
  messages: Message[];
  lastTypingId: string | null;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  userId: string;
  actorId: string;
  postId: string | null;
  read: boolean;
  createdAt: string;
  actor: User;
}

export interface Event {
  id: string;
  title: string;
  details: string;
  startTime: string;
  endTime: string | null;
  location: string;
  hostId: string;
  host: User;
  createdAt: string;
  comments: EventComment[];
  interests: Interest[];
  _count?: { interests: number; comments: number };
}

export interface EventComment {
  id: string;
  content: string;
  createdAt: string;
  eventId: string;
  userId: string;
  user: User;
}

export interface Interest {
  id: string;
  userId: string;
  eventId: string;
  createdAt: string;
  user: User;
  event: Event;
}

export interface Discussion {
  id: string;
  topic: string;
  content: string;
  forumId: string;
  forum: { id: string; title: string };
  userId: string;
  user: User;
  createdAt: string;
}

export interface Forum {
  id: string;
  title: string;
  description: string;
  category: string;
  creatorId: string;
  creator: User;
  discussions: Discussion[];
}
