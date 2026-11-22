import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | THREADIFY Admin" },
  robots: { index: false, follow: false },
};

/**
 * Server-side gate (Supabase mode): signed-out visitors go to login, signed-in non-admins get a 404.
 * This is a convenience layer. The real enforcement is row-level security in the database:
 * even a customer who reached these pages could not read or change admin data.
 * (In demo mode there is no server session, so the client-side AdminGuard applies instead.)
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sb = await getServerSupabase();
  if (sb) {
    const { data } = await sb.auth.getUser();
    if (!data.user) redirect("/account/login?next=/admin");
    const { data: profile } = await sb.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    if (profile?.role !== "admin") notFound();
  }
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
