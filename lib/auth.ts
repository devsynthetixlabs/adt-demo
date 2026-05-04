import { supabase } from "./supabaseClient";

export interface AuthSession {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  firmName?: string;
}

export async function signupUser({
  fullName,
  email,
  password,
  phone,
  role,
  firmName,
}: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: string;
  firmName?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
        firm_name: firmName,
        phone,
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function signinUser(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function sendPhoneOTP(
  phone: string
): Promise<{ success: boolean; error?: string }> {
  const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
  const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function verifyPhoneOTP(
  phone: string,
  code: string,
  options?: { fullName?: string; role?: string; firmName?: string }
): Promise<{ success: boolean; error?: string }> {
  const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
  const { error, data } = await supabase.auth.verifyOtp({
    phone: formattedPhone,
    token: code,
    type: "sms",
  });

  if (error) return { success: false, error: error.message };

  if (data.user && options) {
    const existing = await getProfile(data.user.id);
    if (!existing) {
      const { error: insertError } = await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: options.fullName || "",
        role: options.role || "contractor",
        firm_name: options.firmName,
        phone: formattedPhone,
      });
      if (insertError) return { success: false, error: "Account created but profile setup failed. Please try again." };
    }
  }

  return { success: true };
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const profile = await getProfile(session.user.id);
  if (!profile) return null;

  return {
    userId: session.user.id,
    email: session.user.email || "",
    fullName: profile.full_name,
    role: profile.role,
    firmName: profile.firm_name || undefined,
  };
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) return null;
  return data;
}

export async function signoutUser(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getServerSession(cookieHeader: string | null): Promise<AuthSession | null> {
  try {
    const { createServerClient } = await import("@supabase/ssr");
    const supabaseServer = createServerClient(
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

    const { data: { session } } = await supabaseServer.auth.getSession();
    if (!session?.user) return null;

    const profile = await getProfile(session.user.id);
    if (!profile) return null;

    return {
      userId: session.user.id,
      email: session.user.email || "",
      fullName: profile.full_name,
      role: profile.role,
      firmName: profile.firm_name || undefined,
    };
  } catch {
    return null;
  }
}
