export type UserRole = 'ADMIN' | 'CUSTOMER';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  role: string;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: Date | null;
}

export interface CurrentSession {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  impersonatedBy?: string | null;
}

export interface UserSessionData {
  user: CurrentUser;
  session: CurrentSession;
}
