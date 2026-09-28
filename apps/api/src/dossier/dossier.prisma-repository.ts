import { Injectable } from "@nestjs/common";

import type { CibleDossier } from "../authorization/authorization.types.js";
import { toPrismaClient } from "../database/prisma-transaction-runner.js";
import type { Transaction } from "../database/transaction.types.js";
import { toCibleDossier } from "./dossier.mapper.js";
import { DossierRepository } from "./dossier.repository.js";

@Injectable()
export class PrismaDossierRepository extends DossierRepository {
  async findCibleById(tx: Transaction, dossierId: string): Promise<CibleDossier | null> {
    const ligne = await toPrismaClient(tx).dossier.findUnique({
      where: { id: dossierId },
      select: {
        id: true,
        regionId: true,
        beneficiaireId: true,
        statut: true,
        // Attribution en cours seulement ; membres en exercice seulement.
        commissionDossiers: {
          where: { dateRetrait: null },
          select: {
            commission: {
              select: { membres: { where: { dateRetrait: null }, select: { accountId: true } } },
            },
          },
        },
      },
    });

    return ligne ? toCibleDossier(ligne) : null;
  }
}
