import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * `tailwind-merge` embarque sa propre connaissance du thème par défaut de
 * Tailwind : il ignore les échelles ajoutées dans `@theme`. Sans cette
 * déclaration, il ne voit pas que `text-h1` et `text-sm` sont deux tailles de
 * police concurrentes, les laisse cohabiter, et c'est l'ordre de la feuille de
 * styles — non celui des classes — qui tranche. Symptôme observé : un
 * `text-sm` de base l'emportait sur le `text-label-lg` d'une variante.
 *
 * Les noms listés ici doivent rester alignés sur les tokens `--text-*` déclarés
 * dans `src/styles/globals.css`.
 */
const FONT_SIZES = ["display-lg", "h1", "h2", "body-lg", "body", "body-sm", "label-lg", "caption"];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: FONT_SIZES }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
