import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PREFIXES = ["/dashboard"];
const AUTH_ROUTE = "/auth";
const ROLE_SELECT_ROUTE = "/auth/role-select";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          supabaseResponse.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          supabaseResponse.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const isAuthenticated = !!session;

  const { pathname } = request.nextUrl;

  // Allow auth callback and role-select without redirect loop
  if (pathname.startsWith("/auth/callback") || pathname.startsWith(ROLE_SELECT_ROUTE)) {
    return supabaseResponse;
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = pathname.startsWith(AUTH_ROUTE);

  if (isProtected && !isAuthenticated) {
    const url = new URL(AUTH_ROUTE, request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && isAuthenticated) {
    // Check if user needs role selection
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session!.user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.redirect(new URL(ROLE_SELECT_ROUTE, request.url));
    }

    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // For authenticated users accessing protected routes, check if profile exists
  if (isAuthenticated && isProtected) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session!.user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.redirect(new URL(ROLE_SELECT_ROUTE, request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/", "/auth", "/auth/:path*", "/dashboard/:path*"],
};
