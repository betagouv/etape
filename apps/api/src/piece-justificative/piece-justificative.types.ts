import type { StatutPiece } from "./piece-justificative.enum.js";

/** La pièce telle que le métier la manipule : ni stockage S3, ni empreinte. */
export interface PieceJustificative {
  readonly id: string;
  readonly dossierId: string;
  readonly typePieceId: string;
  readonly version: number;
  readonly statut: StatutPiece;
  /** Renseignés une fois la pièce contrôlée. */
  readonly instructeurId?: string;
  readonly dateControle?: Date;
  readonly motifRefus?: string;
}

/** Ce que le service demande au repository d'écrire pour valider une pièce. */
export interface ValidationPiece {
  readonly dossierId: string;
  readonly pieceId: string;
  readonly instructeurId: string;
  readonly dateControle: Date;
}

/**
 * Réponse de `POST /dossier/:dossierId/piece/:pieceId/validation`.
 *
 * À déplacer dans `packages/api-contract` (schéma zod + `RouteResponse`) dès
 * que le paquet existe : son porteur n'est pas encore attribué
 * (`architecture-api.md`, points restés ouverts).
 */
export interface PieceJustificativeResponse {
  readonly id: string;
  readonly statut: StatutPiece;
  /** ISO 8601. */
  readonly dateControle: string | null;
}
