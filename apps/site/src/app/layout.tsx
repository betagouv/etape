import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { ThemeProvider } from "@etape/ui/components/theme-provider";
import { SkipLinks } from "@etape/ui/components/skip-links";
import { CONTENT_ID } from "@/lib/nav";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ETAPE — En pleine réflexion sur votre vie professionnelle ?",
  description:
    "Le simulateur ETAPE vous aide à identifier les dispositifs, accompagnements et financements qui peuvent soutenir votre projet de reconversion ou d'évolution professionnelle, selon votre situation.",
};

/**
 * Liens d'évitement, calqués sur service-public.gouv.fr (« Contenu », « Menu »,
 * « Recherche », « Pied de page »).
 *
 * Réduit à « Contenu » pour l'instant : les repères « Menu » et « Pied de page »
 * appartiennent à l'en-tête et au pied de page, hors périmètre ici. Les ajouter
 * sans leur cible produirait des liens morts. À compléter en même temps qu'eux —
 * c'est ce qui rendra le critère d'acceptation entièrement vérifiable.
 */
const SKIP_LINKS = [{ href: `#${CONTENT_ID}`, label: "Contenu" }];

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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
