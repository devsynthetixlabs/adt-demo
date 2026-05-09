import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

export async function getApiUser(request: NextRequest): Promise<User | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // read-only — API routes don't set cookies
        },
      },
    }
  );

  const { data } = await supabase.auth.getUser();
  if (data.user) return data.user;

  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { data: bearerData } = await supabase.auth.getUser(token);
    if (bearerData.user) return bearerData.user;
  }

  return null;
}
