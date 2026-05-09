'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { API } from "@/constants/api";

const SESSION_TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    ),
  ]);
}

// ─── Session Type ───────────────────────────────────────────────────────────
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

// ─── Context Type ───────────────────────────────────────────────────────────
interface AuthContextType {
  session: AuthSession | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  signUpUser: (params: {
    firstName: string;
    lastName: string;
    fullName?: string;
    email: string;
    password: string;
    phone?: string;
    dob?: string;
    role: string;
    firmName?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  signInUser: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOutUser: () => Promise<void>;
  updateUserRole: (
    role: string,
    firstName?: string,
    lastName?: string,
    fullName?: string,
    firmName?: string
  ) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (
    firstName?: string,
    lastName?: string,
    phone?: string,
    dob?: string
  ) => Promise<{ success: boolean; error?: string }>;
  createOrganization: (
    name: string,
    ownerId: string
  ) => Promise<{ success: boolean; orgId?: string; error?: string }>;
  createInvitation: (
    orgId: string,
    email: string,
    role: string,
    createdBy: string
  ) => Promise<{ success: boolean; token?: string; error?: string }>;
  acceptInvitation: (
    token: string,
    userId: string
  ) => Promise<{ success: boolean; error?: string }>;
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

async function buildSession(): Promise<AuthSession | null> {
  try {
    const res = await fetch(API.ME);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Standalone — no state needed, safe to call outside provider too
export async function createOrganization(
  name: string,
  ownerId: string
): Promise<{ success: boolean; orgId?: string; error?: string }> {
  // Insert organization directly
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name, owner_id: ownerId })
    .select("id")
    .single();

  if (orgError) {
    console.error("Organization creation error:", orgError.message);
    return { success: false, error: orgError.message };
  }

  // Insert owner as organization member
  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({ organization_id: org.id, user_id: ownerId, role: "owner" });

  if (memberError) {
    console.error("Organization member creation error:", memberError.message);
    return { success: false, error: memberError.message };
  }

  return { success: true, orgId: org.id };
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { user } } = await withTimeout(supabase.auth.getUser(), SESSION_TIMEOUT_MS);
      if (!user) { setSession(null); return; }
      const built = await withTimeout(buildSession(), SESSION_TIMEOUT_MS);
      setSession(built);
    } catch (err) {
      console.error("refreshSession failed:", err);
      setSession(null);
    }
  }, []);

  useEffect(() => {
    refreshSession().finally(() => setIsLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async () => {
        try {
          const built = await withTimeout(buildSession(), SESSION_TIMEOUT_MS);
          setSession(built);
        } catch {
          setSession(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [refreshSession]);

  // ─── signUpUser ─────────────────────────────────────────────────────────
  const signUpUser = async ({
    firstName, lastName, fullName, email, password, phone, dob, role, firmName,
  }: {
    firstName: string; lastName: string; fullName?: string; email: string;
    password: string; phone?: string; dob?: string; role: string; firmName?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const computedFullName = fullName || `${firstName} ${lastName}`.trim();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, full_name: computedFullName, role, firm_name: firmName, phone, dob },
      },
    });

    if (error) return { success: false, error: error.message };

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        full_name: computedFullName,
        phone: phone || null,
        dob: dob || null,
        role: role || null,
        firm_name: firmName || null,
      }, { onConflict: "id" });
      if (profileError) console.error("Profile creation error:", profileError);
    }

    return { success: true };
  };

  // ─── signInUser ─────────────────────────────────────────────────────────
  const signInUser = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        return { success: false, error: "Please confirm your email first. Check your inbox." };
      }
      return { success: false, error: error.message };
    }

    // Fallback: ensure org exists for users who may have bypassed the callback
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email_confirmed_at) {
      const { data: orgMember } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();


      if (!orgMember) {
        const userRole = user.user_metadata?.role;
        const name = user.user_metadata?.full_name || user.email || "User";
        const firm = user.user_metadata?.firm_name;
        const orgName = userRole === "owner" && firm ? firm : `${name}'s Workspace`;
        await createOrganization(orgName, user.id);
      }
    }

    return { success: true };
  };

  // ─── signOutUser ────────────────────────────────────────────────────────
  const signOutUser = async (): Promise<void> => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // ─── updateUserRole ─────────────────────────────────────────────────────
  const updateUserRole = async (
    role: string,
    firstName?: string,
    lastName?: string,
    fullName?: string,
    firmName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return { success: false, error: userError?.message || "No session" };

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          role,
          first_name: firstName || user.user_metadata?.first_name,
          last_name: lastName || user.user_metadata?.last_name,
          full_name: fullName || user.user_metadata?.full_name,
          firm_name: firmName,
        },
      });
      if (updateError) return { success: false, error: updateError.message };

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        first_name: firstName || user.user_metadata?.first_name || "",
        last_name: lastName || user.user_metadata?.last_name || "",
        full_name: fullName || user.user_metadata?.full_name || user.email || "User",
        phone: user.user_metadata?.phone || null,
        dob: user.user_metadata?.dob || null,
        role,
        firm_name: firmName || null,
      }, { onConflict: "id" });
      if (profileError) return { success: false, error: profileError.message };

      // Check if org already exists (might have been created by DB trigger)
      const { data: existingMember, error: memberError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (memberError) console.error("Error checking existing member:", memberError);

      if (!existingMember) {
        const resolvedName = fullName || user.user_metadata?.full_name || "User";
        const orgName = role === "owner" && firmName ? firmName : `${resolvedName}'s Workspace`;
        const orgResult = await createOrganization(orgName, user.id);
        if (!orgResult.success) return { success: false, error: orgResult.error };
      }

      await refreshSession();
      return { success: true };
    } catch (err: any) {
      console.error("updateUserRole error:", err);
      return { success: false, error: err.message || "An unexpected error occurred" };
    }
  };

  // ─── updateUserProfile ───────────────────────────────────────────────
  const updateUserProfile = async (
    firstName?: string,
    lastName?: string,
    phone?: string,
    dob?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return { success: false, error: userError?.message || "No session" };

      const resolvedFirst = firstName ?? user.user_metadata?.first_name ?? "";
      const resolvedLast = lastName ?? user.user_metadata?.last_name ?? "";
      const fullName = resolvedFirst || resolvedLast
        ? `${resolvedFirst} ${resolvedLast}`.trim()
        : user.user_metadata?.full_name ?? user.email ?? "User";

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        first_name: resolvedFirst,
        last_name: resolvedLast,
        full_name: fullName,
        phone: phone ?? user.user_metadata?.phone ?? null,
        dob: dob ?? user.user_metadata?.dob ?? null,
        role: user.user_metadata?.role ?? null,
        firm_name: user.user_metadata?.firm_name ?? null,
      }, { onConflict: "id" });
      if (profileError) return { success: false, error: profileError.message };

      await refreshSession();
      return { success: true };
    } catch (err: any) {
      console.error("updateUserProfile error:", err);
      return { success: false, error: err.message || "An unexpected error occurred" };
    }
  };

  // ─── createInvitation ───────────────────────────────────────────────────
  const createInvitation = async (
    orgId: string,
    email: string,
    role: string,
    _createdBy: string
  ): Promise<{ success: boolean; token?: string; error?: string }> => {
    const res = await fetch(API.INVITATIONS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, email, role }),
    });

    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error || "Failed to create invitation" };
    return { success: true, token: json.token };
  };

  // ─── acceptInvitation ───────────────────────────────────────────────────
  const acceptInvitation = async (
    token: string,
    _userId: string
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await fetch(API.INVITATIONS_ACCEPT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error || "Invalid or expired invitation" };

    await refreshSession();
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{
      session, isLoading, refreshSession,
      signUpUser, signInUser, signOutUser,
      updateUserRole, updateUserProfile, createOrganization,
      createInvitation, acceptInvitation,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
