// Server-side only — used by app/page.tsx and other server components.
// Client-side auth logic lives in context/authProvider/provider.tsx

export interface AuthSession {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dob: string;
  phone: string;
  role: string;
  firmName?: string;
  activeOrgId?: string;
  orgRole?: string;
  orgCreated: boolean;
}

export async function getServerSession(cookieHeader: string | null): Promise<AuthSession | null> {
  try {
    const { createServerClient } = await import("@supabase/ssr");
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            if (!cookieHeader) return undefined;
            const match = cookieHeader.match(new RegExp(`(^|;)\\s*${name}=([^;]*)`));
            return match ? decodeURIComponent(match[2]) : undefined;
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, full_name, dob, phone, role, firm_name")
      .eq("id", session.user.id)
      .maybeSingle();

    if (!profile) return null;

    const { data: orgMember } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", session.user.id)
      .limit(1)
      .maybeSingle();

    return {
      userId: session.user.id,
      email: session.user.email || "",
      firstName: profile.first_name || "",
      lastName: profile.last_name || "",
      fullName: profile.full_name,
      dob: profile.dob || "",
      phone: profile.phone || "",
      role: profile.role || session.user.user_metadata?.role || orgMember?.role || "contractor",
      firmName: profile.firm_name || session.user.user_metadata?.firm_name,
      activeOrgId: orgMember?.organization_id,
      orgRole: orgMember?.role,
      orgCreated: !!orgMember?.organization_id,
    };
  } catch {
    return null;
  }
}
