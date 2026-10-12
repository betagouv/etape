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
// Les titres (bandeau, titres de section) sont en Bricolage Grotesque, comme
// les titres du site. Seule la graisse 600 des styles de titre du kit est
// embarquée, à la taille optique 14 : malgré le nom interne du fichier
// (« 96pt ExtraBold SemiBold »), ses chasses sont celles de l'instance opsz 14.
//
// `NEXT_PUBLIC_BASE_PATH` : le `basePath` Next ne préfixe pas les URL vers
// `public/` écrites à la main (voir `app/page.tsx` pour le même besoin sur
// le logo du ministère).

import { Font } from "@react-pdf/renderer";

export const PDF_FONT_FAMILY = "Geist";
export const PDF_HEADING_FONT_FAMILY = "Bricolage Grotesque";

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

  Font.register({
    family: PDF_HEADING_FONT_FAMILY,
    fonts: [{ src: `${assets}/fonts/BricolageGrotesque-SemiBold.ttf`, fontWeight: 600 }],
  });
}
