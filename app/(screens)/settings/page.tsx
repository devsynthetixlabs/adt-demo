"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/authProvider/provider";
import { useLocale } from "@/context/localeProvider/provider";
import { locales, localeLabels } from "@/i18n/config";
import type { Locale } from "@/i18n/config";

export default function SettingsPage() {
  const router = useRouter();
  const { session, isLoading, signOutUser, updateUserProfile } = useAuth();
  const { locale, setLocale } = useLocale();
  const t = useTranslations("settings");
  const ta = useTranslations("auth");
  const tc = useTranslations("common");
  const th = useTranslations("header");
  const tr = useTranslations("role");

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
      const timer = setTimeout(() => setToast({ msg: "", ok: true }), 3000);
      return () => clearTimeout(timer);
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
  const roleLabel = tr(session.role);

  async function handleSave() {
    setIsSaving(true);
    try {
      const result = await updateUserProfile(form.firstName, form.lastName, form.phone, form.dob);
      if (result.success) {
        setToast({ msg: t("profileUpdated"), ok: true });
      } else {
        setToast({ msg: result.error || t("updateFailed"), ok: false });
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F2]">
      <header className="sticky top-0 z-100 bg-white border-b-2 border-[#E8601C] shadow-[0_2px_16px_rgba(232,96,28,0.08)] h-16 px-6 sm:px-8 flex items-center justify-between">
        <div className="font-serif text-[1.5rem] font-semibold tracking-[0.1em] text-[#E8601C]">
          ANANTAM<span className="text-[#2C2420] font-light"> · SITE</span>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1.5 text-[0.82rem] text-[#9C8E86] hover:text-[#E8601C] transition-colors cursor-pointer font-medium"
        >
          {tc("backToDashboard")}
        </button>
      </header>

      <div className="max-w-[760px] mx-auto px-6 sm:px-8 py-10">
        <div className="mb-8">
          <div className="font-serif text-[2rem] font-semibold text-[#2C2420]">{t("title")}</div>
          <div className="text-[0.84rem] text-[#9C8E86] mt-1">{t("subtitle")}</div>
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
            <div className="font-semibold text-[0.88rem] text-[#2C2420] tracking-[0.02em]">{t("personalInfo")}</div>
            <div className="text-[0.72rem] text-[#9C8E86] mt-0.5">{t("personalInfoDesc")}</div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[0.72rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">{t("firstName")}</label>
                <input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-[0.84rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-xl text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white transition-all"
                  placeholder={t("firstNamePlaceholder")}
                />
              </div>
              <div>
                <label className="text-[0.72rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">{t("lastName")}</label>
                <input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-[0.84rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-xl text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white transition-all"
                  placeholder={t("lastNamePlaceholder")}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[0.72rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">{t("phoneNumber")}</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  type="tel"
                  className="w-full px-3.5 py-2.5 text-[0.84rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-xl text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white transition-all"
                  placeholder={t("phonePlaceholder")}
                />
              </div>
              <div>
                <label className="text-[0.72rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">{t("dob")}</label>
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
        <div className="bg-white rounded-2xl border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)] overflow-hidden mb-5">
          <div className="px-6 py-4 border-b border-[#E2DAD1] bg-[#F7F5F2]">
            <div className="font-semibold text-[0.88rem] text-[#2C2420] tracking-[0.02em]">{t("accountInfo")}</div>
            <div className="text-[0.72rem] text-[#9C8E86] mt-0.5">{t("accountInfoDesc")}</div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[0.72rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">{t("emailAddress")}</label>
                <div className="w-full px-3.5 py-2.5 text-[0.84rem] bg-[#F0EDE8] border-[1.5px] border-[#E2DAD1] rounded-xl text-[#9C8E86] cursor-not-allowed">
                  {session.email}
                </div>
                <div className="text-[0.68rem] text-[#B8AFA8] mt-1.5">{t("cannotChange")}</div>
              </div>
              <div>
                <label className="text-[0.72rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">{t("role")}</label>
                <div className="w-full px-3.5 py-2.5 text-[0.84rem] bg-[#F0EDE8] border-[1.5px] border-[#E2DAD1] rounded-xl text-[#9C8E86] flex items-center gap-2 cursor-not-allowed">
                  <span>{roleIcon}</span>
                  <span>{roleLabel}</span>
                </div>
                <div className="text-[0.68rem] text-[#B8AFA8] mt-1.5">{t("setByOrg")}</div>
              </div>
            </div>
            {session.firmName && (
              <div className="mt-4">
                <label className="text-[0.72rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">{t("firmOrg")}</label>
                <div className="w-full px-3.5 py-2.5 text-[0.84rem] bg-[#F0EDE8] border-[1.5px] border-[#E2DAD1] rounded-xl text-[#9C8E86] cursor-not-allowed">
                  {session.firmName}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Language & Region */}
        <div className="bg-white rounded-2xl border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)] overflow-hidden mb-5">
          <div className="px-6 py-4 border-b border-[#E2DAD1] bg-[#F7F5F2]">
            <div className="font-semibold text-[0.88rem] text-[#2C2420] tracking-[0.02em]">{t("languageSection")}</div>
            <div className="text-[0.72rem] text-[#9C8E86] mt-0.5">{t("languageSectionDesc")}</div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[0.88rem] font-medium text-[#2C2420]">{t("language")}</div>
                <div className="text-[0.76rem] text-[#9C8E86] mt-0.5">{t("languageDesc")}</div>
              </div>
              <div className="relative">
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as Locale)}
                  className="appearance-none bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-xl text-[0.84rem] text-[#2C2420] px-4 py-2.5 pr-10 outline-none focus:border-[#E8601C] focus:bg-white transition-all cursor-pointer"
                >
                  {locales.map((l) => (
                    <option key={l} value={l}>
                      {localeLabels[l]}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9C8E86] text-[0.6rem]">▾</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center justify-end mb-8">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#E8601C] text-white rounded-xl px-10 py-3 text-[0.88rem] font-semibold cursor-pointer transition-all hover:bg-[#C04E12] shadow-[0_4px_16px_rgba(232,96,28,0.25)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? tc("saving") : tc("saveChanges")}
          </button>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-2xl border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2DAD1] bg-[#F7F5F2]">
            <div className="font-semibold text-[0.88rem] text-[#2C2420] tracking-[0.02em]">{t("accountActions")}</div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[0.88rem] font-medium text-[#2C2420]">{t("signOut")}</div>
                <div className="text-[0.76rem] text-[#9C8E86] mt-0.5">{t("signOutDesc")}</div>
              </div>
              <button
                onClick={async () => { await signOutUser(); router.push("/auth"); }}
                className="bg-[#FDECEA] text-[#C0392B] border border-[#EDB9B9] rounded-xl px-5 py-2.5 text-[0.82rem] font-semibold cursor-pointer transition-all hover:bg-[#C0392B] hover:text-white"
              >
                {th("signOut")}
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
