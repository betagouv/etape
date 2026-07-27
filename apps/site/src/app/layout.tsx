import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { ThemeProvider } from "@etape/ui/components/theme-provider";

import { SiteHeader } from "@/components/site-header";
import { SkipLinks } from "@/components/skip-links";
import { MAIN_CONTENT_ID } from "@/lib/navigation";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ETAPE",
  description:
    "ETAPE permet à chaque salarié qui le désire de réussir sa transition professionnelle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${openSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SkipLinks />
          <SiteHeader />
          {/*
            `tabIndex={-1}` rend le contenu principal focusable par programme :
            sans lui, certains navigateurs suivent le lien d'évitement sans
            déplacer le focus, qui resterait alors au début de la page.
          */}
          <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
