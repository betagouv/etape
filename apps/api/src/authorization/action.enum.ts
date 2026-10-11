/**
 * Actions soumises à autorisation. Verbe anglais, nom métier français
 * (`nommage.md`) : `piece:validate`, jamais `piece:valider`.
 *
 * Deux familles, parce qu'elles ne portent pas sur la même cible : une action
 * sur un dossier se décide avec le dossier en main (région, propriétaire,
 * statut, commission), une action d'administration avec la région visée.
 */
export const ACTION_DOSSIER = {
  DOSSIER_READ: "dossier:read",
  DOSSIER_UPDATE: "dossier:update",
  DOSSIER_SUBMIT: "dossier:submit",
  PIECE_VALIDATE: "piece:validate",
  PIECE_REFUSE: "piece:refuse",
  FICHE_COMMISSION_READ: "fiche-commission:read",
  DECISION_RECORD: "decision:record",
} as const;

export const ACTION_REGION = {
  HABILITATION_GRANT: "habilitation:grant",
  HABILITATION_REVOKE: "habilitation:revoke",
} as const;

export const ACTION = { ...ACTION_DOSSIER, ...ACTION_REGION } as const;

export type ActionDossier = (typeof ACTION_DOSSIER)[keyof typeof ACTION_DOSSIER];
export type ActionRegion = (typeof ACTION_REGION)[keyof typeof ACTION_REGION];
export type Action = ActionDossier | ActionRegion;
