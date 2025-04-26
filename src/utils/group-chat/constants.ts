export const MESSAGES_PER_PAGE = 20;

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

export const MESSAGE_TYPES = {
  TEXT: 'text',
  SYSTEM: 'system',
  IMAGE: 'image'
} as const;

export const GROUP_TYPES = {
  PRIVATE: 'private',
  PUBLIC: 'public'
} as const;

export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_GROUP_NAME_LENGTH = 50;
export const MIN_GROUP_MEMBERS = 2;
export const MAX_GROUP_MEMBERS = 100;

export const MESSAGE_CHECK_INTERVAL = 60000; // 1 minute
export const TIME_REMAINING_UPDATE_INTERVAL = 1000; // 1 second 