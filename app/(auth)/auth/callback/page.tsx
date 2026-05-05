"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getProfile } from "@/lib/auth";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "signup";

  useEffect(() => {
    async function handleCallback() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          router.push("/auth?error=Could not authenticate");
          return;
        }

        const userId = data.session.user.id;
        const profile = await getProfile(userId);

        if (!profile) {
          // New user - need to select role
          router.push("/auth/role-select");
          return;
        }

        // Existing user with profile - redirect to dashboard
        const redirect = searchParams.get("redirect");
        router.push(redirect || "/dashboard");
      } catch {
        router.push("/auth?error=Authentication failed");
      }
    }

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F5F2]">
      <div className="text-center">
        <div className="font-serif text-[1.8rem] font-semibold text-[#2C2420] mb-4">
          Completing sign in...
        </div>
        <div className="text-[0.82rem] text-[#9C8E86]">
          Please wait while we redirect you.
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5F2]">
        <div className="text-center">
          <div className="font-serif text-[1.8rem] font-semibold text-[#2C2420] mb-4">
            Loading...
          </div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
