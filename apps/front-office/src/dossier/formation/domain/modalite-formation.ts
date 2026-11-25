/** Les réponses à « Comment se déroule la formation ? », dans l'ordre des cases (maquette 01). */
export const MODALITE_FORMATION = {
  PRESENTIEL: "presentiel",
  DISTANCE: "distance",
  PRATIQUE_ENTREPRISE: "pratique-entreprise",
} as const;

/** Une modalité de formation, parmi celles de `MODALITE_FORMATION`. */
export type ModaliteFormation = (typeof MODALITE_FORMATION)[keyof typeof MODALITE_FORMATION];

/** Libellé de chaque modalité de formation. */
export const MODALITE_FORMATION_LABEL: Record<ModaliteFormation, string> = {
  [MODALITE_FORMATION.PRESENTIEL]: "En présentiel",
  [MODALITE_FORMATION.DISTANCE]: "À distance",
  [MODALITE_FORMATION.PRATIQUE_ENTREPRISE]: "Pratique en entreprise",
};
