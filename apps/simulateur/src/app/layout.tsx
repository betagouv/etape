import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import { ThemeProvider } from "@etape/ui/components/theme-provider";
import { SkipLinks } from "@etape/ui/components/skip-links";
import { Toaster } from "@etape/ui/components/sonner";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

// Titres et logo « etape. ». Axe de graisse seul : `opsz` reste à 14, la valeur
// des titres du kit Figma.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Simulateur ETAPE",
  description:
    "Le simulateur recense l'ensemble des dispositifs français de reconversion et d'évolution professionnelle et vous oriente vers le bon organisme.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // motion-safe : défilement fluide des liens d'ancre, sauf si l'utilisateur a
  // demandé à réduire les animations (prefers-reduced-motion).
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geist.variable} ${bricolage.variable} h-full antialiased motion-safe:scroll-smooth`}
    >
      <body className="flex min-h-full flex-col">
        {/* Thème clair imposé : le mode sombre du kit Figma n'est pas encore décliné
            aux couleurs ETAPE (primaire gris clair). `forcedTheme` ignore aussi un
            choix « dark » resté en localStorage. Le thème `.dark` de globals.css
            est gardé pour le jour où il le sera. */}
        <ThemeProvider attribute="class" forcedTheme="light" disableTransitionOnChange>
          <SkipLinks />
          <div id="contenu" tabIndex={-1} className="flex flex-1 flex-col">
            {children}
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
