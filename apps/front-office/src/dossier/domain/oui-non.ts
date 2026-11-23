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

/** Vrai après un « oui » ; faux après un « non » ou sans réponse. */
export function isOui(answer: OuiNon | undefined): boolean {
  return answer === OUI_NON.OUI;
}

/** Les champs qu'une question fait apparaître : demandés après un « oui », aucun sinon. */
export function findFieldsAfterOui<TName extends string>(
  answer: OuiNon | undefined,
  fields: readonly TName[],
): readonly TName[] {
  return isOui(answer) ? fields : [];
}
