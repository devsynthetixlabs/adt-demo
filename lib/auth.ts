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

export async function ensureProfile(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", session.user.id)
    .maybeSingle();

  if (existing) return;

  await supabase.from("profiles").insert({
    id: session.user.id,
    full_name: session.user.user_metadata?.full_name || session.user.email || "User",
    role: session.user.user_metadata?.role || "owner",
    firm_name: session.user.user_metadata?.firm_name,
    phone: session.user.phone,
  });
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
    if (error.message.includes("Email not confirmed")) {
      return { success: false, error: "Please confirm your email first. Check your inbox." };
    }
    return { success: false, error: error.message };
  }

  await ensureProfile();

  return { success: true };
}

export async function sendPhoneOTP(
  phone: string
): Promise<{ success: boolean; error?: string }> {
  const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
  console.log("Sending OTP to:", formattedPhone);
  const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
  if (error) {
    console.error("Supabase OTP error:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function verifyPhoneOTP(
  phone: string,
  code: string,
  options?: { fullName?: string; role?: string; firmName?: string }
): Promise<{ success: boolean; error?: string }> {
  const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
  console.log("Verifying OTP for:", formattedPhone, "code:", code);
  
  const { error, data } = await supabase.auth.verifyOtp({
    phone: formattedPhone,
    token: code,
    type: "sms",
  });

  if (error) {
    console.error("OTP verification error:", error);
    return { success: false, error: error.message };
  }

  console.log("OTP verified successfully. User:", data.user?.id);

  if (data.user && options) {
    console.log("Creating/updating profile for user:", data.user.id);
    
    // Update user metadata with full name
    if (options.fullName) {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: options.fullName,
          role: options.role || "contractor",
          firm_name: options.firmName,
        },
      });
      if (updateError) console.error("User metadata update error:", updateError);
    }
    
    // Create/update profile
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      full_name: options.fullName || "",
      role: options.role || "contractor",
      firm_name: options.firmName,
      phone: formattedPhone,
    });
    
    if (profileError) {
      console.error("Profile creation error:", profileError);
    }
  }

  return { success: true };
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  let profile = await getProfile(session.user.id);
  
  if (!profile) {
    await ensureProfile();
    profile = await getProfile(session.user.id);
    if (!profile) return null;
  }

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

export async function updateUserRole(role: string, fullName?: string, firmName?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { success: false, error: "No session" };

    // Update user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...session.user.user_metadata,
        role,
        full_name: fullName || session.user.user_metadata?.full_name,
        firm_name: firmName || session.user.user_metadata?.firm_name,
      },
    });

    if (updateError) return { success: false, error: updateError.message };

    // Upsert profile
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: session.user.id,
        full_name: fullName || session.user.user_metadata?.full_name || session.user.email || "User",
        role,
        firm_name: firmName || session.user.user_metadata?.firm_name,
        phone: session.user.phone,
      }, { onConflict: "id" });

    if (profileError) console.error("Profile upsert error:", profileError);

    return { success: true };
  } catch (err) {
    return { success: false, error: "Failed to update role" };
  }
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();

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
