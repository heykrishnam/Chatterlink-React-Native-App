import { MESSAGE_TYPES, GROUP_TYPES } from '../utils/group-chat/constants';

export interface GroupMember {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  lastSeen?: Date;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderEmail: string;
  senderName: string;
  content: string;
  type: typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  readBy: string[];
  autoDeleteAt?: Date;
  imageUrl?: string;
}

export interface Group {
  id: string;
  name: string;
  members: string[];
  createdBy: string;
  createdAt: string;
  autoDeleteDuration?: number | null;
}

export interface GroupChatState {
  messages: GroupMessage[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  members: GroupMember[];
  isAdmin: boolean;
  messageDeletionTimers: Record<string, NodeJS.Timeout>;
}

export interface GroupChatActions {
  sendMessage: (content: string, type?: typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES]) => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  leaveGroup: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
}

export interface Message {
  id: string;
  text: string;
  sender: string;
  senderName: string;
  timestamp: Date;
  readBy: string[];
  autoDeleteTime?: Date;
  type?: 'text' | 'system' | 'image';
}

export interface User {
  id: string;
  uid: string;
  username: string;
  email: string;
  photoURL?: string;
}

export interface GroupChatScreenProps {
  route: {
    params: {
      group: Group;
    };
  };
  navigation: any;
}

export interface JoinGroupScreenProps {
  navigation: any;
}

export interface CreateGroupScreenProps {
  navigation: any;
}

export interface GroupsScreenProps {
  navigation: any;
}

export const AUTO_DELETE_OPTIONS = [
  { label: '1 minute', value: 60 * 1000, icon: 'timer' },
  { label: '15 minutes', value: 15 * 60 * 1000, icon: 'timer' },
  { label: '1 hour', value: 60 * 60 * 1000, icon: 'timer' },
  { label: '6 hours', value: 6 * 60 * 60 * 1000, icon: 'timer' },
  { label: '12 hours', value: 12 * 60 * 60 * 1000, icon: 'timer' },
  { label: '24 hours', value: 24 * 60 * 60 * 1000, icon: 'timer' },
  { label: '3 days', value: 3 * 24 * 60 * 60 * 1000, icon: 'timer' },
  { label: '7 days', value: 7 * 24 * 60 * 60 * 1000, icon: 'timer' },
  { label: 'Never', value: 0, icon: 'timer-off' }
] as const;

export const MESSAGES_PER_PAGE = 20;

export enum GroupType {
  PRIVATE = 'private',
  PUBLIC = 'public',
}

export enum MessageType {
  TEXT = 'text',
  SYSTEM = 'system',
  IMAGE = 'image',
} 