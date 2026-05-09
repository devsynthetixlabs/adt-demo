"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authProvider/provider";

export default function SettingsPage() {
  const router = useRouter();
  const { session, isLoading, signOutUser, updateUserProfile } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", dob: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ msg: "", ok: true });

  useEffect(() => {
    if (!isLoading && !session) router.replace("/auth");
  }, [isLoading, session, router]);

  useEffect(() => {
    if (session) {
      setForm({
        firstName: session.firstName || "",
        lastName: session.lastName || "",
        phone: session.phone || "",
        dob: session.dob || "",
      });
    }
  }, [session]);

  useEffect(() => {
    if (toast.msg) {
      const t = setTimeout(() => setToast({ msg: "", ok: true }), 3000);
      return () => clearTimeout(t);
    }
  }, [toast.msg]);

  if (isLoading || !session) return null;

  const initials =
    session.firstName && session.lastName
      ? `${session.firstName[0]}${session.lastName[0]}`.toUpperCase()
      : session.fullName
        ? session.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
        : "U";

  const roleIcon = session.role === "owner" ? "👑" : session.role === "architect" ? "📐" : "🔧";
  const roleLabel = session.role === "owner" ? "Owner" : session.role === "architect" ? "Architect" : "Contractor";

  async function handleSave() {
    setIsSaving(true);
    try {
      const result = await updateUserProfile(form.firstName, form.lastName, form.phone, form.dob);
      if (result.success) {
        setToast({ msg: "Profile updated successfully", ok: true });
      } else {
        setToast({ msg: result.error || "Failed to update profile", ok: false });
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F2]">
      {/* Header */}
      <header className="sticky top-0 z-100 bg-white border-b-2 border-[#E8601C] shadow-[0_2px_16px_rgba(232,96,28,0.08)] h-16 px-6 sm:px-8 flex items-center justify-between">
        <div className="font-serif text-[1.5rem] font-semibold tracking-[0.1em] text-[#E8601C]">
          ANANTAM<span className="text-[#2C2420] font-light"> · SITE</span>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1.5 text-[0.82rem] text-[#9C8E86] hover:text-[#E8601C] transition-colors cursor-pointer font-medium"
        >
          ← Back to Dashboard
        </button>
      </header>

      <div className="max-w-[760px] mx-auto px-6 sm:px-8 py-10">
        <div className="mb-8">
          <div className="font-serif text-[2rem] font-semibold text-[#2C2420]">Profile Settings</div>
          <div className="text-[0.84rem] text-[#9C8E86] mt-1">Manage your personal information and account preferences</div>
        </div>

        {/* Avatar & Identity */}
        <div className="bg-white rounded-2xl border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)] p-6 mb-5 flex items-center gap-5">
          <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-[#E8601C] to-[#C04E12] flex items-center justify-center text-white text-[1.6rem] font-bold flex-shrink-0 shadow-[0_4px_16px_rgba(232,96,28,0.3)]">
            {initials}
          </div>
          <div>
            <div className="font-serif text-[1.25rem] font-semibold text-[#2C2420]">{session.fullName}</div>
            <div className="text-[0.8rem] text-[#9C8E86] mt-0.5">{session.email}</div>
            <div className="inline-flex items-center gap-1.5 mt-2 bg-[#FEF4EF] border border-[#F4895A] text-[#E8601C] text-[0.72rem] font-semibold px-2.5 py-1 rounded-full">
              <span>{roleIcon}</span>
              <span>{roleLabel}</span>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-2xl border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)] overflow-hidden mb-5">
          <div className="px-6 py-4 border-b border-[#E2DAD1] bg-[#F7F5F2]">
            <div className="font-semibold text-[0.88rem] text-[#2C2420] tracking-[0.02em]">Personal Information</div>
            <div className="text-[0.72rem] text-[#9C8E86] mt-0.5">Update your name, phone number, and date of birth</div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[0.72rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">First Name</label>
                <input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-[0.84rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-xl text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white transition-all"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="text-[0.72rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Last Name</label>
                <input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-[0.84rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-xl text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white transition-all"
                  placeholder="Enter last name"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[0.72rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Phone Number</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  type="tel"
                  className="w-full px-3.5 py-2.5 text-[0.84rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-xl text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white transition-all"
                  placeholder="+91 98000 00000"
                />
              </div>
              <div>
                <label className="text-[0.72rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-[0.84rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-xl text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-2xl border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)] overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-[#E2DAD1] bg-[#F7F5F2]">
            <div className="font-semibold text-[0.88rem] text-[#2C2420] tracking-[0.02em]">Account Information</div>
            <div className="text-[0.72rem] text-[#9C8E86] mt-0.5">These details are managed by your organization</div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[0.72rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Email Address</label>
                <div className="w-full px-3.5 py-2.5 text-[0.84rem] bg-[#F0EDE8] border-[1.5px] border-[#E2DAD1] rounded-xl text-[#9C8E86] cursor-not-allowed">
                  {session.email}
                </div>
                <div className="text-[0.68rem] text-[#B8AFA8] mt-1.5">Cannot be changed here</div>
              </div>
              <div>
                <label className="text-[0.72rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Role</label>
                <div className="w-full px-3.5 py-2.5 text-[0.84rem] bg-[#F0EDE8] border-[1.5px] border-[#E2DAD1] rounded-xl text-[#9C8E86] flex items-center gap-2 cursor-not-allowed">
                  <span>{roleIcon}</span>
                  <span>{roleLabel}</span>
                </div>
                <div className="text-[0.68rem] text-[#B8AFA8] mt-1.5">Set by your organization</div>
              </div>
            </div>
            {session.firmName && (
              <div className="mt-4">
                <label className="text-[0.72rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Firm / Organization</label>
                <div className="w-full px-3.5 py-2.5 text-[0.84rem] bg-[#F0EDE8] border-[1.5px] border-[#E2DAD1] rounded-xl text-[#9C8E86] cursor-not-allowed">
                  {session.firmName}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center justify-end mb-8">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#E8601C] text-white rounded-xl px-10 py-3 text-[0.88rem] font-semibold cursor-pointer transition-all hover:bg-[#C04E12] shadow-[0_4px_16px_rgba(232,96,28,0.25)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving…" : "Save Changes"}
          </button>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-2xl border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2DAD1] bg-[#F7F5F2]">
            <div className="font-semibold text-[0.88rem] text-[#2C2420] tracking-[0.02em]">Account Actions</div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[0.88rem] font-medium text-[#2C2420]">Sign Out</div>
                <div className="text-[0.76rem] text-[#9C8E86] mt-0.5">You will be redirected to the login page</div>
              </div>
              <button
                onClick={async () => { await signOutUser(); router.push("/auth"); }}
                className="bg-[#FDECEA] text-[#C0392B] border border-[#EDB9B9] rounded-xl px-5 py-2.5 text-[0.82rem] font-semibold cursor-pointer transition-all hover:bg-[#C0392B] hover:text-white"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {toast.msg && (
        <div className={`fixed bottom-8 right-8 text-white border-l-4 px-6 py-3.5 rounded-lg text-[0.82rem] shadow-[0_8px_40px_rgba(0,0,0,0.18)] z-[9999] max-w-[320px] ${toast.ok ? "bg-[#2C2420] border-[#E8601C]" : "bg-[#C0392B] border-[#8B1A1A]"}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
