/**
 * Type Definitions - Consolidated
 * Central repository for all TypeScript types
 */

export type UserProfile = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  two_fa_enabled: boolean;
  location_history_retention: number; // days
};

export type Location = {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  device_id: string;
  timestamp: string;
  created_at: string;
};

export type Device = {
  id: string;
  user_id: string;
  name: string;
  device_type: "mobile" | "desktop" | "tablet";
  last_seen: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Invite = {
  id: string;
  from_user_id: string;
  to_email: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  expires_at: string;
};

export type MapMarker = {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  name: string;
  timestamp: Date;
  deviceName?: string;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
};

export type AuthState = {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isLoading: boolean;
};

export type NotificationType = "success" | "error" | "warning" | "info";

export type Notification = {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
};
