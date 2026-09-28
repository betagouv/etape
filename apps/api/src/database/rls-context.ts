import type { PrismaClient } from "../generated/prisma/client.ts";

/**
 * Contexte lu par les policies RLS (fonctions app_account_id(), app_region_ids(),
 * app_cep_dossier_id() de la migration `add_rls_and_constraints`).
 * Construit par l'API à partir de la session et des attributions actives,
 * jamais à partir d'une donnée envoyée par le navigateur.
 */
export interface RlsContext {
  readonly accountId?: string;
  readonly regionIds?: readonly string[];
  readonly cepDossierId?: string;
}

type TransactionClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

function toSettings(context: RlsContext): [string, string, string] {
  return [
    context.accountId ?? "",
    context.regionIds && context.regionIds.length > 0 ? `{${context.regionIds.join(",")}}` : "",
    context.cepDossierId ?? "",
  ];
}

/**
 * Client dont chaque requête de modèle s'exécute dans une transaction qui pose
 * d'abord le contexte (`set_config(…, true)` : local à la transaction, donc
 * sans fuite d'une requête à l'autre via le pool).
 */
// Type de retour inféré : celui de $extends, que Prisma ne nomme pas.
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function forRlsContext(prisma: PrismaClient, context: RlsContext) {
  const [accountId, regionIds, cepDossierId] = toSettings(context);

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const [, result] = await prisma.$transaction([
            prisma.$executeRaw`SELECT set_config('app.account_id', ${accountId}, true),
                                      set_config('app.region_ids', ${regionIds}, true),
                                      set_config('app.cep_dossier_id', ${cepDossierId}, true)`,
            query(args),
          ]);
          return result;
        },
      },
    },
  });
}

/**
 * Pour une transaction de service (plusieurs écritures atomiques) : le
 * contexte est posé en première instruction de la transaction interactive.
 */
export async function runInRlsTransaction<T>(
  prisma: PrismaClient,
  context: RlsContext,
  work: (tx: TransactionClient) => Promise<T>,
): Promise<T> {
  const [accountId, regionIds, cepDossierId] = toSettings(context);

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.account_id', ${accountId}, true),
                                set_config('app.region_ids', ${regionIds}, true),
                                set_config('app.cep_dossier_id', ${cepDossierId}, true)`;
    return work(tx);
  });
}
