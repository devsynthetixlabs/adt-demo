"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { updateUserRole, getProfile } from "@/lib/auth";
import { ROLE_OPTIONS, Role } from "@/types/auth";

export default function RoleSelectPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>("owner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }
      setUserName(session.user.user_metadata?.full_name || session.user.email || "User");
    }
    checkSession();
  }, [router]);

  async function handleRoleSubmit() {
    setError("");
    setLoading(true);

    const result = await updateUserRole(selectedRole);

    if (!result.success) {
      setError(result.error || "Failed to save role. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
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
            Almost there!
          </div>
          <h1 className="font-serif font-normal text-[clamp(2rem,3.4vw,3rem)] leading-[1.1] tracking-[-0.005em] mb-5">
            Select your <em className="not-italic font-light text-orange-light">role</em>
          </h1>
          <p className="text-[0.95rem] text-white/72 leading-[1.6]">
            Choose how you'll be using Anantam Site to get the right experience.
          </p>
        </div>

        <div className="relative z-10 text-[0.82rem] text-white/50">
          Welcome, {userName}!
        </div>
      </aside>

      {/* RIGHT: ROLE SELECTION FORM */}
      <main className="flex flex-col bg-[#F7F5F2] flex-1 min-h-screen lg:min-h-0 lg:h-screen overflow-y-auto">
        <div className="flex-1 px-6 sm:px-10 pb-12">
          <div className="w-full max-w-[460px] mx-auto pt-10 lg:pt-[20vh]">
            <div className="mb-8">
              <h2 className="font-serif text-[2.1rem] font-medium leading-[1.15] text-[#2C2420] tracking-[-0.005em] mb-2">
                Select your role
              </h2>
              <p className="text-[0.88rem] text-[#9C8E86] leading-[1.6]">
                This helps us customize your workspace experience.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-[#FDECEA] border border-[#F5C6CB] rounded-lg text-[0.82rem] text-[#721C24]">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`relative border-[1.5px] rounded-[10px] p-4 text-left transition-all ${
                    selectedRole === option.key
                      ? "border-[#E8601C] bg-[#FEF4EF] shadow-[0_0_0_3px_rgba(232,96,28,0.08)]"
                      : "border-[#E2DAD1] bg-white hover:border-[#F4895A]"
                  }`}
                  onClick={() => setSelectedRole(option.key as Role)}
                >
                  {selectedRole === option.key && (
                    <span className="absolute top-2 right-[10px] w-[18px] h-[18px] bg-[#E8601C] text-white rounded-full grid place-items-center text-[0.7rem] font-bold">
                      ✓
                    </span>
                  )}
                  <div className="font-serif text-[1.1rem] font-semibold text-[#2C2420] mb-[0.15rem]">
                    {option.name}
                  </div>
                  <div className="text-[0.74rem] text-[#9C8E86] leading-[1.4]">
                    {option.desc}
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleRoleSubmit}
              disabled={loading}
              className="w-full py-3 bg-[#E8601C] text-white border-none rounded-lg text-[0.85rem] font-medium transition-all hover:bg-[#C04E12] disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation"
            >
              {loading ? "Saving..." : "Continue to Dashboard →"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
