"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en.json";
import hiMessages from "@/messages/hi.json";
import type { Locale } from "@/i18n/config";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleCtx = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => {},
});

export function useLocale() {
  return useContext(LocaleCtx);
}

const messagesMap: Record<Locale, typeof enMessages> = {
  en: enMessages,
  hi: hiMessages,
};

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.cookie = `NEXT_LOCALE=${l};path=/;max-age=${60 * 60 * 24 * 365}`;
  }, []);

  useEffect(() => {
    const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
    if (match) {
      const saved = match[1] as Locale;
      if (saved === "en" || saved === "hi") {
        setLocaleState(saved);
      }
    }
  }, []);

  return (
    <LocaleCtx.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messagesMap[locale]} timeZone="Asia/Kolkata">
        {children}
      </NextIntlClientProvider>
    </LocaleCtx.Provider>
  );
}
