import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./config";

let client: SupabaseClient | null = null;

/** Browser client (anon key only). Returns null in demo mode. */
export function getBrowserSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  client ??= createBrowserClient(supabaseUrl, supabaseAnonKey);
  return client;
}
