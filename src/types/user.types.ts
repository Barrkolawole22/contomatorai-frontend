export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  subscription?: Subscription;
  settings?: UserSettings;
}

export type UserRole = 'admin' | 'user';

export type UserStatus = 'active' | 'inactive' | 'pending';

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise';

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export interface UserSettings {
  defaultTone?: string;
  defaultContentType?: string;
  emailNotifications?: {
    contentCreated?: boolean;
    contentPublished?: boolean;
    contentShared?: boolean;
    weeklyDigest?: boolean;
  };
  uiPreferences?: {
    theme?: 'light' | 'dark' | 'system';
    contentView?: 'list' | 'grid';
    sidebarCollapsed?: boolean;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  settings?: Partial<UserSettings>;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}