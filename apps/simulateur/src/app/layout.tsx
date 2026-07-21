import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { ThemeProvider } from "@etape/ui/components/theme-provider";
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
  return (
    <html lang="fr" suppressHydrationWarning className={`${openSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
