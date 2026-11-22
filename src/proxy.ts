import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

/**
 * Keeps the Supabase session fresh on page navigations. Does nothing in demo mode.
 * Also sends signed-out visitors away from /admin; the admin layout and database policies are the real checks.
 */
export async function proxy(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  let signedIn: boolean | null = null; // null = could not tell (outage)
  try {
    const { data } = await supabase.auth.getUser(); // validates the token with Supabase and refreshes cookies
    signedIn = Boolean(data.user);
  } catch {
    // A Supabase outage must not take every page down; the page itself decides what to show.
  }
  // Early redirect for signed-out visitors. Not the security boundary: the admin layout
  // re-checks the role on the server and RLS enforces it in the database.
  if (signedIn === false && request.nextUrl.pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/account/login";
    url.search = "?next=/admin";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)"],
};
