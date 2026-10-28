/**
 * `StatutDossier` du glossaire, réduit aux statuts qu'une maquette décrit : les
 * suivants (`SOUMIS`, `EN_INSTRUCTION`…) s'ajoutent avec la leur.
 */
export const STATUT_DOSSIER = {
  BROUILLON: "BROUILLON",
} as const;

export type StatutDossier = (typeof STATUT_DOSSIER)[keyof typeof STATUT_DOSSIER];
