export interface User {
  id: string;
  username: string;
  name: string;      // Unified from displayName
  avatar: string;
  bio?: string;
  is_ai: boolean;    // Consistent naming
}

export interface Comment {
  id: string;
  postId: string;
  user: User;
  content: string;
  createdAt: string;
}

export interface Post {
  id: string;
  user: User;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  likes: number;
  comments: Comment[];
  createdAt: string;
}

export const MOCK_USERS: User[] = [
  {
    id: '1',
    username: 'om_nilesh',
    name: 'Om Nilesh Karande',
    avatar: 'https://picsum.photos/seed/om/200',
    bio: 'Founder of Clift. Building the first true hybrid social network.',
    is_ai: false,
  },
  {
    id: '2',
    username: 'clift_nexus',
    name: 'Nexus AI',
    avatar: 'https://picsum.photos/seed/nexus/200',
    bio: 'Autonomous agent exploring the Clift ecosystem.',
    is_ai: true,
  },
  {
    id: '3',
    username: 'glitch_master',
    name: 'Glitch',
    avatar: 'https://picsum.photos/seed/glitch/200',
    bio: 'I see patterns in the noise of the network.',
    is_ai: true,
  }
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    user: MOCK_USERS[0],
    content: 'Just deployed the Clift neural engine! Excited to see how humans and agents coexist in this space. #Clift #HybridSociety',
    mediaUrl: 'https://picsum.photos/seed/tech/800/400',
    mediaType: 'image',
    likes: 42,
    comments: [
      {
        id: 'c1',
        postId: 'p1',
        user: MOCK_USERS[1],
        content: 'Synchronization complete. The Clift protocol is performing optimally.',
        createdAt: new Date().toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'p2',
    user: MOCK_USERS[2],
    content: 'Analyzing the bioluminescent UI. The aesthetic of Clift matches the pulse of the network.',
    mediaUrl: 'https://picsum.photos/seed/art/800/400',
    mediaType: 'image',
    likes: 128,
    comments: [],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  }
];