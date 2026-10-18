import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import { notFound } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/i18n/client";
import { CLIENT_MESSAGE_PREFIXES } from "@/i18n/client-messages";
import { pickMessages } from "@/i18n/dictionaries";
import { hasLocale, LOCALES } from "@/i18n/locales";
import { getT } from "@/i18n/server";
import { APP_NAME } from "@/lib/app-name";
import { TRPCReactProvider } from "@/trpc/client";
import "../globals.css";

const schibsted = Schibsted_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

// One prerendered tree per language (Cache Components needs every root
// param listed); the proxy sends URLs without a locale here.
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: APP_NAME, description: t("meta.description") };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <html lang={lang} className={`${schibsted.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background font-sans text-foreground">
        <I18nProvider
          locale={lang}
          messages={pickMessages(lang, CLIENT_MESSAGE_PREFIXES)}
        >
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </I18nProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
