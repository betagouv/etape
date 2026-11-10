/** Teintes du titre de page. */
export const TITLE_TONE = {
  DEFAULT: "default",
  ACCENT: "accent",
} as const;

/** Teinte du titre : l'inscription l'a en vert (Figma FRONT-OFFICE, « 01. SIGN-UP »). */
export type TitleTone = (typeof TITLE_TONE)[keyof typeof TITLE_TONE];

/** Classe de couleur de chaque teinte. */
export const TITLE_TONE_CLASS: Record<TitleTone, string> = {
  [TITLE_TONE.DEFAULT]: "text-foreground",
  [TITLE_TONE.ACCENT]: "text-primary",
};
