import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import {
  CoreBackdrop,
  MobileAtmosphere,
} from "@/components/CoreBackdrop";
import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

const themeBoot = `(function(){try{var k='theme';var s=localStorage.getItem(k);var m=s==='light'||s==='dark'?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');var d=document.documentElement;d.classList.remove('light','dark');d.classList.add(m);}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className="dark antialiased"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-background font-sans text-foreground">
        <JsonLd />
        <MobileAtmosphere />
        <CoreBackdrop />
        <SiteNav />
        <div className="relative z-10 flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
