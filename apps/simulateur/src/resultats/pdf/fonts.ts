// Polices du PDF de résultats.
//
// react-pdf ne partage rien avec `next/font` (utilisé pour le reste de
// l'app) : il lui faut ses propres fichiers de police, enregistrés une fois
// via `Font.register`. Auto-hébergées sous `public/fonts/` — aucun appel
// réseau à l'exécution, cohérent avec le reste du simulateur.
//
// Geist, la police du design system, en TTF statiques : react-pdf ne lit ni
// le WOFF2 ni les polices variables. Sous-ensemble latin de Fontsource, qui
// couvre tous les caractères des textes du PDF.
//
// `NEXT_PUBLIC_BASE_PATH` : le `basePath` Next ne préfixe pas les URL vers
// `public/` écrites à la main (voir `app/page.tsx` pour le même besoin sur
// le logo du ministère).

import { Font } from "@react-pdf/renderer";

export const PDF_FONT_FAMILY = "Geist";

let registered = false;

/** Idempotent : `Font.register` ne doit être appelé qu'une fois par police. */
export function registerPdfFonts(): void {
  if (registered) return;
  registered = true;

  const assets = process.env.NEXT_PUBLIC_BASE_PATH;

  Font.register({
    family: PDF_FONT_FAMILY,
    fonts: [
      { src: `${assets}/fonts/Geist-Regular.ttf`, fontWeight: 400 },
      { src: `${assets}/fonts/Geist-SemiBold.ttf`, fontWeight: 600 },
      { src: `${assets}/fonts/Geist-Bold.ttf`, fontWeight: 700 },
    ],
  });
}
