import { Injectable } from "@nestjs/common";

import { toPrismaClient } from "../database/prisma-transaction-runner.js";
import type { Transaction } from "../database/transaction.types.js";
import { JournalSecuriteRepository } from "./journal-securite.repository.js";
import type { EntreeJournal } from "./journal-securite.types.js";

@Injectable()
export class PrismaJournalSecuriteRepository extends JournalSecuriteRepository {
  async record(tx: Transaction, entree: EntreeJournal): Promise<void> {
    // `createMany` plutôt que `create` : pas de RETURNING, donc pas besoin que
    // la ligne soit relisible par l'acteur (policy `journal_securite_select`).
    await toPrismaClient(tx).journalSecurite.createMany({
      data: [
        {
          evenement: entree.evenement,
          accountId: entree.accountId,
          regionId: entree.regionId,
          dossierId: entree.dossierId,
          cibleType: entree.cible?.type,
          cibleId: entree.cible?.id,
        },
      ],
    });
  }
}
