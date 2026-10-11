import { Injectable } from "@nestjs/common";

import type { Prisma } from "../generated/prisma/client.ts";
import { PrismaService } from "./prisma.service.js";
import { TransactionRunner } from "./transaction-runner.js";
import type { RlsContext, Transaction } from "./transaction.types.js";

/**
 * `set_config(…, true)` : local à la transaction. Au niveau de la connexion,
 * le contexte fuiterait d'une requête à l'autre par le pool.
 *
 * Rappel : un superutilisateur ignore la RLS, même `FORCE`. L'API se connecte
 * avec le rôle `etape_app` (NOBYPASSRLS), tests compris.
 */
@Injectable()
export class PrismaTransactionRunner extends TransactionRunner {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  run<T>(context: RlsContext, work: (tx: Transaction) => Promise<T>): Promise<T> {
    const accountId = context.accountId ?? "";
    const regionIds = context.regionIds?.length ? `{${context.regionIds.join(",")}}` : "";
    const cepDossierId = context.cepDossierId ?? "";

    return this.prisma.$transaction(async (client) => {
      await client.$executeRaw`SELECT set_config('app.account_id', ${accountId}, true),
                                      set_config('app.region_ids', ${regionIds}, true),
                                      set_config('app.cep_dossier_id', ${cepDossierId}, true)`;
      return work(fromPrismaClient(client));
    });
  }
}

function fromPrismaClient(client: Prisma.TransactionClient): Transaction {
  return client as unknown as Transaction;
}

/** Réservé aux repositories Prisma : retrouve le client derrière la transaction opaque. */
export function toPrismaClient(tx: Transaction): Prisma.TransactionClient {
  return tx as unknown as Prisma.TransactionClient;
}
