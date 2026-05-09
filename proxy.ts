import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PREFIXES = ["/dashboard"];
const AUTH_ROUTE = "/auth";
const ROLE_SELECT_ROUTE = "/auth/role-select";
const MW_TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
    Promise.resolve(promise).then(resolve, (err) => { clearTimeout(timer); reject(err); });
  });
}

export async function proxy(request: NextRequest) {
  try {
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

    const { data: { session } } = await withTimeout(supabase.auth.getSession(), MW_TIMEOUT_MS);
    const isAuthenticated = !!session;

    const { pathname } = request.nextUrl;

    // Allow auth callback, role-select, verify-email, and invite without redirect loop
    if (
      pathname.startsWith("/auth/callback") ||
      pathname.startsWith(ROLE_SELECT_ROUTE) ||
      pathname.startsWith("/auth/verify-email") ||
      pathname.startsWith("/invite")
    ) {
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
      try {
        const { data: profile } = await withTimeout(
          supabase.from("profiles").select("role").eq("id", session!.user.id).maybeSingle(),
          MW_TIMEOUT_MS
        );
        if (!profile) {
          return NextResponse.redirect(new URL(ROLE_SELECT_ROUTE, request.url));
        }
      } catch {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // For authenticated users accessing protected routes, check if profile exists
    if (isAuthenticated && isProtected) {
      try {
        const { data: profile } = await withTimeout(
          supabase.from("profiles").select("role").eq("id", session!.user.id).maybeSingle(),
          MW_TIMEOUT_MS
        );
        if (!profile) {
          return NextResponse.redirect(new URL(ROLE_SELECT_ROUTE, request.url));
        }
      } catch {
        // profile check timed out — let request through, client will handle
      }
    }

    return supabaseResponse;
  } catch {
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: ["/", "/auth", "/auth/:path*", "/dashboard/:path*", "/invite/:path*"],
};
