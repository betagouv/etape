import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * `tailwind-merge` ignore les échelles ajoutées dans `@theme` : sans cette
 * déclaration il ne voit pas que `text-h1` et `text-sm` sont concurrentes, et
 * c'est l'ordre de la feuille de styles qui tranche au lieu de celui des classes.
 * À garder aligné sur les tokens `--text-*` de `src/styles/globals.css`.
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
