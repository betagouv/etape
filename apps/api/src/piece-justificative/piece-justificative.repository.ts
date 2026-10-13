import type { Transaction } from "../database/transaction.types.js";
import type { PieceJustificative, ValidationPiece } from "./piece-justificative.types.js";

export abstract class PieceJustificativeRepository {
  /** `null` si la pièce n'existe pas, n'appartient pas à ce dossier, ou est hors RLS. */
  abstract findInDossier(
    tx: Transaction,
    dossierId: string,
    pieceId: string,
  ): Promise<PieceJustificative | null>;

  /**
   * Passe la pièce à `VALIDEE` si elle est encore `DEPOSEE`. `null` si elle a
   * été contrôlée entre la lecture et l'écriture (deux instructeurs en même
   * temps) : la condition est dans le `WHERE`, pas dans un `if` du service.
   */
  abstract markValidee(
    tx: Transaction,
    validation: ValidationPiece,
  ): Promise<PieceJustificative | null>;
}
