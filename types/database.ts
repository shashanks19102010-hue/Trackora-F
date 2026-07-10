export type ConnectionStatus = "pending" | "accepted" | "declined" | "revoked";
export type Relationship = "family" | "friend" | "colleague" | "other";
export type PrecisionLevel = "exact" | "approximate" | "city-only";
export type NotificationType = "invite" | "invite_accepted" | "geofence" | "low_battery" | "system";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          avatar_config: Record<string, string> | null;
          phone: string | null;
          two_factor_enabled: boolean;
          two_factor_secret: string | null;
          two_factor_pending_secret: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string; full_name: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      connections: {
        Row: {
          id: string;
          owner_id: string;
          connected_user_id: string | null;
          invited_phone: string | null;
          invited_email: string | null;
          label: string;
          relationship: Relationship;
          status: ConnectionStatus;
          invite_token: string;
          created_at: string;
          responded_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["connections"]["Row"]> & {
          owner_id: string;
          label: string;
          relationship: Relationship;
        };
        Update: Partial<Database["public"]["Tables"]["connections"]["Row"]>;
      };
      devices: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          platform: string;
          model: string | null;
          app_version: string | null;
          last_seen_at: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["devices"]["Row"]> & {
          owner_id: string;
          name: string;
          platform: string;
        };
        Update: Partial<Database["public"]["Tables"]["devices"]["Row"]>;
      };
      location_pings: {
        Row: {
          id: string;
          device_id: string;
          owner_id: string;
          lat: number;
          lng: number;
          accuracy_meters: number | null;
          battery_pct: number | null;
          captured_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["location_pings"]["Row"]> & {
          device_id: string;
          owner_id: string;
          lat: number;
          lng: number;
          captured_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["location_pings"]["Row"]>;
      };
      privacy_settings: {
        Row: {
          user_id: string;
          share_location_with: string[];
          precision: PrecisionLevel;
          share_when_active: boolean;
          history_retention_days: number;
          ghost_mode: boolean;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["privacy_settings"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["privacy_settings"]["Row"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          user_id: string;
          type: NotificationType;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
      };
      login_attempts: {
        Row: {
          id: string;
          identifier: string;
          succeeded: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["login_attempts"]["Row"]> & {
          identifier: string;
          succeeded: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["login_attempts"]["Row"]>;
      };
    };
  };
}
