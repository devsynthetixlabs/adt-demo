"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/authProvider/provider";

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { acceptInvitation } = useAuth();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Invalid invite link. No token found.");
      setStatus("error");
      return;
    }

    async function handleInvite() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push(`/auth?redirect=${encodeURIComponent(`/invite?token=${token}`)}`);
        return;
      }

      const result = await acceptInvitation(token, session.user.id);

      if (!result.success) {
        setError(result.error || "Failed to accept invitation.");
        setStatus("error");
        return;
      }

      setStatus("success");
      router.push("/dashboard");
    }

    handleInvite();
  }, [token, router]);

  return (
    <div className="min-h-screen lg:min-h-0 lg:h-screen flex flex-col lg:flex-row">
      {/* LEFT: BRAND PANEL */}
      <aside className="hidden lg:flex relative h-full basis-[51%] bg-gradient-to-b from-[#2C2420] via-[#3a302b] to-[#4a3e37] text-white p-12 flex-col justify-between overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(900px 600px at 110% 10%, rgba(232,96,28,0.18), transparent 60%), radial-gradient(700px 500px at -10% 100%, rgba(232,96,28,0.10), transparent 60%)",
          }}
        />
        <div className="relative z-10 flex items-center justify-between">
          <div className="font-serif text-2xl font-semibold tracking-[0.08em] text-orange">
            ANANTAM<span className="text-white font-light"> · SITE</span>
          </div>
        </div>
        <div className="relative z-10 max-w-[460px] my-10 lg:my-0">
          <div className="text-[0.7rem] tracking-[0.18em] uppercase text-orange-light mb-5">
            You're invited!
          </div>
          <h1 className="font-serif font-normal text-[clamp(2rem,3.4vw,3rem)] leading-[1.1] tracking-[-0.005em] mb-5">
            Join your <em className="not-italic font-light text-orange-light">team.</em>
          </h1>
          <p className="text-[0.95rem] text-white/72 leading-[1.6] max-w-[38ch]">
            You've been invited to collaborate on a project in Anantam Site Manager.
          </p>
        </div>
        <div className="relative z-10 text-[0.82rem] text-white/50">
          Anantam Site Manager
        </div>
      </aside>

      {/* RIGHT: STATUS PANEL */}
      <main className="flex flex-col bg-[#F7F5F2] flex-1 min-h-screen lg:min-h-0 lg:h-screen overflow-y-auto">
        <div className="flex-1 px-6 sm:px-10 pb-12">
          <div className="w-full max-w-[460px] mx-auto pt-[20vh]">
            {status === "loading" && (
              <div className="text-center">
                <div className="font-serif text-[2.1rem] font-medium leading-[1.15] text-[#2C2420] tracking-[-0.005em] mb-2">
                  Accepting invite...
                </div>
                <p className="text-[0.88rem] text-[#9C8E86] leading-[1.6]">
                  Please wait while we add you to the workspace.
                </p>
              </div>
            )}

            {status === "error" && (
              <div>
                <h2 className="font-serif text-[2.1rem] font-medium leading-[1.15] text-[#2C2420] tracking-[-0.005em] mb-2">
                  Invite unavailable
                </h2>
                <p className="text-[0.88rem] text-[#9C8E86] leading-[1.6] mb-8">
                  This invite link may have expired or already been used.
                </p>
                <div className="p-3 bg-[#FDECEA] border border-[#F5C6CB] rounded-lg text-[0.82rem] text-[#721C24] mb-8">
                  {error}
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="w-full py-3 bg-[#E8601C] text-white border-none rounded-lg text-[0.85rem] font-medium transition-all hover:bg-[#C04E12] touch-manipulation"
                >
                  Go to dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F7F5F2]">
          <div className="font-serif text-[1.8rem] font-semibold text-[#2C2420]">
            Loading...
          </div>
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
