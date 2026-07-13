/**
 * Unified Supabase Client
 * Single source of truth for database operations
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Database query helpers
 */
export const db = {
  // User operations
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateUserProfile(userId: string, updates: Record<string, any>) {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Location operations
  async insertLocation(locationData: Record<string, any>) {
    const { data, error } = await supabase
      .from("locations")
      .insert([locationData]);
    if (error) throw error;
    return data;
  },

  async getUserLocations(
    userId: string,
    limit: number = 100,
    offset: number = 0
  ) {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return data;
  },

  // Device operations
  async getDevices(userId: string) {
    const { data, error } = await supabase
      .from("devices")
      .select("*")
      .eq("user_id", userId);
    if (error) throw error;
    return data;
  },

  async insertDevice(deviceData: Record<string, any>) {
    const { data, error } = await supabase
      .from("devices")
      .insert([deviceData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Invite operations
  async getInvites(userId: string) {
    const { data, error } = await supabase
      .from("invites")
      .select("*")
      .eq("user_id", userId);
    if (error) throw error;
    return data;
  },

  async createInvite(inviteData: Record<string, any>) {
    const { data, error } = await supabase
      .from("invites")
      .insert([inviteData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

export default supabase;
