export type ContentChangePayload = {
  userId?: string;
  content: string;
  timestamp?: string;
};

export type CursorChangePayload = {
  userId?: string;
  position: number;
  timestamp?: string;
};

export type PresencePayload = {
  userId: string;
  message?: string;
};
