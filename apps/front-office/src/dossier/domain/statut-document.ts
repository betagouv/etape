/** Règles de chaque statut : `docs/conventions/glossaire.md`, « Statut d'un document » — les modifier ensemble. */
export const STATUT_DOCUMENT = {
  A_DEPOSER: "A_DEPOSER",
  DEPOSE: "DEPOSE",
  FACULTATIF: "FACULTATIF",
} as const;

/** Un statut de document, parmi ceux de `STATUT_DOCUMENT`. */
export type StatutDocument = (typeof STATUT_DOCUMENT)[keyof typeof STATUT_DOCUMENT];

/** Un document facultatif le reste, avec ou sans pièce ; un obligatoire est déposé dès sa première pièce. */
export function getStatutDocument(isRequired: boolean, pieceCount: number): StatutDocument {
  if (!isRequired) return STATUT_DOCUMENT.FACULTATIF;
  return pieceCount > 0 ? STATUT_DOCUMENT.DEPOSE : STATUT_DOCUMENT.A_DEPOSER;
}
