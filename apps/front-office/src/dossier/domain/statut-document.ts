/** Règles de chaque statut : `docs/conventions/glossaire.md`, « Statut d'un document » — les modifier ensemble. */
export const STATUT_DOCUMENT = {
  A_DEPOSER: "A_DEPOSER",
  DEPOSE: "DEPOSE",
  FACULTATIF: "FACULTATIF",
} as const;

/** Un statut de document, parmi ceux de `STATUT_DOCUMENT`. */
export type StatutDocument = (typeof STATUT_DOCUMENT)[keyof typeof STATUT_DOCUMENT];

/** Déposé dès sa première pièce ; sans pièce, à déposer s'il est obligatoire, facultatif sinon. */
export function getStatutDocument(isRequired: boolean, pieceCount: number): StatutDocument {
  if (pieceCount > 0) return STATUT_DOCUMENT.DEPOSE;
  return isRequired ? STATUT_DOCUMENT.A_DEPOSER : STATUT_DOCUMENT.FACULTATIF;
}
