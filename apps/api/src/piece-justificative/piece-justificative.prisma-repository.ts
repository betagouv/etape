import { Injectable } from "@nestjs/common";

import { toPrismaClient } from "../database/prisma-transaction-runner.js";
import type { Transaction } from "../database/transaction.types.js";
import { StatutPiece } from "../generated/prisma/enums.ts";
import { SELECT_PIECE_JUSTIFICATIVE, toPieceJustificative } from "./piece-justificative.mapper.js";
import { PieceJustificativeRepository } from "./piece-justificative.repository.js";
import type { PieceJustificative, ValidationPiece } from "./piece-justificative.types.js";

@Injectable()
export class PrismaPieceJustificativeRepository extends PieceJustificativeRepository {
  async findInDossier(
    tx: Transaction,
    dossierId: string,
    pieceId: string,
  ): Promise<PieceJustificative | null> {
    const ligne = await toPrismaClient(tx).pieceJustificative.findFirst({
      where: { id: pieceId, dossierId },
      select: SELECT_PIECE_JUSTIFICATIVE,
    });
    return ligne ? toPieceJustificative(ligne) : null;
  }

  async markValidee(
    tx: Transaction,
    validation: ValidationPiece,
  ): Promise<PieceJustificative | null> {
    // `updateManyAndReturn` : la mise à jour conditionnelle et la relecture en
    // une requête (UPDATE … WHERE statut = 'DEPOSEE' RETURNING …).
    const [ligne] = await toPrismaClient(tx).pieceJustificative.updateManyAndReturn({
      where: {
        id: validation.pieceId,
        dossierId: validation.dossierId,
        statut: StatutPiece.DEPOSEE,
      },
      data: {
        statut: StatutPiece.VALIDEE,
        instructeurId: validation.instructeurId,
        dateControle: validation.dateControle,
      },
      select: SELECT_PIECE_JUSTIFICATIVE,
    });
    return ligne ? toPieceJustificative(ligne) : null;
  }
}
