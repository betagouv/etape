/**
 * Événements du journal de sécurité : liste fermée, la colonne `evenement`
 * n'accepte que ces valeurs par convention (pas d'enum en base, pour ajouter
 * un événement sans migration).
 */
export const EVENEMENT_SECURITE = {
  HABILITATION_ATTRIBUTION: "habilitation.attribution",
  HABILITATION_REVOCATION: "habilitation.revocation",
  DOSSIER_CONSULTATION: "dossier.consultation",
  PIECE_VALIDATION: "piece.validation",
  PIECE_REFUS: "piece.refus",
} as const;

export type EvenementSecurite = (typeof EVENEMENT_SECURITE)[keyof typeof EVENEMENT_SECURITE];

/** Nature de l'objet visé quand ce n'est pas le dossier lui-même (`cible_type`). */
export const CIBLE_JOURNAL = {
  PIECE_JUSTIFICATIVE: "piece_justificative",
  ACCOUNT: "account",
  COMMISSION: "commission",
} as const;

export type CibleJournal = (typeof CIBLE_JOURNAL)[keyof typeof CIBLE_JOURNAL];
