import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { BackToTop } from "@etape/ui/components/back-to-top";
import { SkipLinks } from "@etape/ui/components/skip-links";
import { ThemeProvider } from "@etape/ui/components/theme-provider";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { MAIN_CONTENT_ID, SKIP_LINKS } from "@/lib/navigation";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

/**
 * Métadonnées par défaut du site. Chaque page précise les siennes — l'accueil le
 * fait dans `page.tsx`.
 */
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
          <SkipLinks links={SKIP_LINKS} />
          {/* Placé haut dans l'arbre : le composant y dépose la sentinelle qui
              commande son affichage, positionnée par rapport à ce point. */}
          <BackToTop targetId={MAIN_CONTENT_ID} />
          <SiteHeader />
          {/*
            `tabIndex={-1}` rend le contenu principal focusable par programme :
            sans lui, certains navigateurs suivent le lien d'évitement sans
            déplacer le focus, qui resterait alors au début de la page.
          */}
          <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
