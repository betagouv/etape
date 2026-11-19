/** Les réponses à une question fermée d'un volet (« Avez-vous déjà remis votre démission… ? »). */
export const OUI_NON = {
  OUI: "oui",
  NON: "non",
} as const;

/** Une réponse, parmi celles de `OUI_NON`. */
export type OuiNon = (typeof OUI_NON)[keyof typeof OUI_NON];

/** Libellé de chaque réponse. */
export const OUI_NON_LABEL: Record<OuiNon, string> = {
  [OUI_NON.OUI]: "Oui",
  [OUI_NON.NON]: "Non",
};
