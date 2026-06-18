export interface AdminMe {
  id: number;
  name: string;
  email: string;
  profileImage: string | null;
  isAdmin: boolean;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  profileImage: string | null;
  city: string | null;
  bio: string | null;
  isAdmin: boolean;
  isBlocked: boolean;
  createdAt: string;
  letterboxdUsername: string | null;
}

export interface UserDetail extends AdminUser {
  backgroundImage: string | null;
  blockedAt: string | null;
  letterboxdConnectedAt: string | null;
  stats: {
    followers: number;
    following: number;
    rated: number;
    watched: number;
    posts: number;
  };
}

export interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Stats {
  totalUsers: number;
  admins: number;
  newThisWeek: number;
  withLetterboxd: number;
}

export interface AppSettings {
  media_uploads_allowed: boolean;
  splash_video_url?: string | null;
  [key: string]: boolean | string | null | undefined;
}

export interface Announcement {
  id: string;
  message: string;
  actionUrl: string | null;
  sentByLabel: string;
  recipientCount: number;
  status: 'sent' | 'scheduled';
  scheduledFor: string | null;
  sentAt: string | null;
  createdAt: string;
}
