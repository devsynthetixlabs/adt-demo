import React from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "@/context/queryProvider/provider";
import { AuthProvider } from "@/context/authProvider/provider";
import { LocaleProvider } from "@/context/localeProvider/provider";
import { defaultLocale } from "@/i18n/config";
import type { Locale } from "@/i18n/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Anantam Site Manager",
  description: "Run every site like your best one.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale: Locale = (cookieStore.get("NEXT_LOCALE")?.value as Locale) || defaultLocale;

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${cormorantGaramond.variable} ${dmSans.variable} antialiased`}
    >
      <body className="min-h-screen antialiased">
        <LocaleProvider initialLocale={locale}>
          <Providers>
            <AuthProvider>
              {children}
            </AuthProvider>
          </Providers>
        </LocaleProvider>
      </body>
    </html>
  );
}
