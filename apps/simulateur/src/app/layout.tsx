import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { ThemeProvider } from "@etape/ui/components/theme-provider";
import { SkipLinks } from "@etape/ui/components/skip-links";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
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
      className={`${openSans.variable} h-full antialiased motion-safe:scroll-smooth`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SkipLinks />
          <div id="contenu" tabIndex={-1} className="flex flex-1 flex-col">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
