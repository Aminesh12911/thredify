/**
 * Supabase configuration.
 * Only NEXT_PUBLIC_* values may reach the browser. The service-role key is
 * server-only and must never be imported from a client component.
 *
 * If the public variables are missing the app runs in DEMO MODE
 * (seed data, browser-local storage) and labels itself accordingly.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isDemoMode = !isSupabaseConfigured;
