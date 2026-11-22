import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./config";

let client: SupabaseClient | null = null;

/** Cookie-free anon client for public catalogue reads (keeps shop pages statically cacheable). */
export function getPublicSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  client ??= createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}
