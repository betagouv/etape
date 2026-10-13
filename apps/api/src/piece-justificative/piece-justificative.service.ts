import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";

import { ACTION } from "../authorization/action.enum.js";
import { toRlsContext } from "../authorization/actor.js";
import { assertCan } from "../authorization/authorization.policy.js";
import type { Actor } from "../authorization/authorization.types.js";
import { TransactionRunner } from "../database/transaction-runner.js";
import { DossierRepository } from "../dossier/dossier.repository.js";
import { CIBLE_JOURNAL, EVENEMENT_SECURITE } from "../journal-securite/journal-securite.enum.js";
import { JournalSecuriteRepository } from "../journal-securite/journal-securite.repository.js";
import { STATUT_PIECE } from "./piece-justificative.enum.js";
import { PieceJustificativeRepository } from "./piece-justificative.repository.js";
import type { PieceJustificative } from "./piece-justificative.types.js";

@Injectable()
export class PieceJustificativeService {
  constructor(
    private readonly transactions: TransactionRunner,
    private readonly dossiers: DossierRepository,
    private readonly pieces: PieceJustificativeRepository,
    private readonly journal: JournalSecuriteRepository,
  ) {}

  /**
   * Un instructeur valide une pièce déposée.
   *
   * Tout se passe dans UNE transaction, ouverte avec le contexte RLS de
   * l'acteur : la cible est lue sous RLS, la matrice décide, la pièce est
   * écrite, l'action est journalisée. Un échec à n'importe quelle étape
   * annule le tout.
   */
  validatePiece(actor: Actor, dossierId: string, pieceId: string): Promise<PieceJustificative> {
    return this.transactions.run(toRlsContext(actor), async (tx) => {
      // 1. La cible. Hors RLS = inexistant : 404 dans les deux cas.
      const cible = await this.dossiers.findCibleById(tx, dossierId);
      if (!cible) throw new NotFoundException();

      // 2. La matrice : bon rôle, dans la région du dossier, au bon statut.
      assertCan(actor, ACTION.PIECE_VALIDATE, cible);

      // 3. Les règles propres à la pièce, qui ne sont pas des droits.
      const piece = await this.pieces.findInDossier(tx, dossierId, pieceId);
      if (!piece) throw new NotFoundException();
      if (piece.statut !== STATUT_PIECE.DEPOSEE)
        throw new ConflictException("La pièce a déjà été contrôlée.");

      const validee = await this.pieces.markValidee(tx, {
        dossierId,
        pieceId,
        instructeurId: actor.accountId,
        dateControle: new Date(),
      });
      if (!validee) throw new ConflictException("La pièce a déjà été contrôlée.");

      // 4. La trace, dans la même transaction que l'action.
      await this.journal.record(tx, {
        evenement: EVENEMENT_SECURITE.PIECE_VALIDATION,
        accountId: actor.accountId,
        regionId: cible.regionId,
        dossierId,
        cible: { type: CIBLE_JOURNAL.PIECE_JUSTIFICATIVE, id: pieceId },
      });

      return validee;
    });
  }
}
