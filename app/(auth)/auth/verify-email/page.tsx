"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function resendVerification() {
    setError("");
    setResending(true);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    setResending(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccessMessage("Verification email resent! Please check your inbox.");
    }
  }

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
            One step away!
          </div>
          <h1 className="font-serif font-normal text-[clamp(2rem,3.4vw,3rem)] leading-[1.1] tracking-[-0.005em] mb-5">
            Please verify your <em className="not-italic font-light text-orange-light">email</em>
          </h1>
          <p className="text-[0.95rem] text-white/72 leading-[1.6]">
            We've sent a verification email to your inbox. Click the link to confirm your account and access your workspace.
          </p>
        </div>

        <div className="relative z-10 text-[0.82rem] text-white/50">
          Didn't receive it? Check your spam folder.
        </div>
      </aside>

      {/* RIGHT: VERIFICATION PANEL */}
      <main className="flex flex-col bg-[#F7F5F2] flex-1 min-h-screen lg:min-h-0 lg:h-screen overflow-y-auto">
        <div className="flex-1 px-6 sm:px-10 pb-12">
          <div className="w-full max-w-[460px] mx-auto pt-[20vh]">
            <div className="mb-8">
              <div className="w-16 h-16 bg-orange-xpale border border-orange-pale rounded-full flex items-center justify-center mb-6">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#E8601C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 6l-10 7L2 6" stroke="#E8601C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <h2 className="font-serif text-[2.1rem] font-medium leading-[1.15] text-[#2C2420] tracking-[-0.005em] mb-2">
                Check your email
              </h2>
              <p className="text-[0.88rem] text-[#9C8E86] leading-[1.6] mb-1">
                We sent a verification link to:
              </p>
              <p className="text-[0.95rem] font-medium text-[#2C2420] mb-8">
                {email || "your email address"}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-[#FDECEA] border border-[#F5C6CB] rounded-lg text-[0.82rem] text-[#721C24]">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-3 bg-[#E8F5EE] border border-[#A0CEB5] rounded-lg text-[0.82rem] text-[#2A6045]">
                ✓ {successMessage}
              </div>
            )}

            <div className="space-y-4 mb-8">
              <button
                type="button"
                onClick={() => router.push(`/auth?mode=signin&email=${encodeURIComponent(email)}`)}
                className="w-full py-3 bg-[#E8601C] text-white border-none rounded-lg text-[0.85rem] font-medium transition-all hover:bg-[#C04E12] touch-manipulation"
              >
                I've confirmed my email → Sign in
              </button>

              <button
                type="button"
                onClick={resendVerification}
                disabled={resending}
                className="w-full py-3 bg-white border-[1.5px] border-[#E2DAD1] rounded-lg text-[0.85rem] font-medium text-[#2C2420] transition-all hover:border-[#E8601C] touch-manipulation disabled:opacity-60"
              >
                {resending ? "Sending..." : "Resend verification email"}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                className="text-[0.82rem] text-[#E8601C] hover:underline"
                onClick={() => router.push("/auth?mode=signup")}
              >
                ← Back to sign up
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
