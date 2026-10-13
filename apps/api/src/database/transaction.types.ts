declare const TRANSACTION_BRAND: unique symbol;

/**
 * Transaction ouverte par `TransactionRunner`. Opaque pour le métier : le
 * service la reçoit et la passe au repository sans rien savoir de Prisma
 * (`architecture-api.md`, décision 2). Seuls les repositories Prisma savent
 * la convertir (`toPrismaClient`).
 */
export interface Transaction {
  readonly [TRANSACTION_BRAND]: true;
}

/**
 * Ce que les policies RLS lisent (`app_account_id()`, `app_region_ids()`,
 * `app_cep_dossier_id()`). Construit par l'API à partir de la session et des
 * habilitations, jamais à partir d'une donnée envoyée par le navigateur.
 */
export interface RlsContext {
  readonly accountId?: string;
  /** Codes INSEE des régions des habilitations actives. */
  readonly regionIds?: readonly string[];
  /** Dossier ouvert par un lien CEP valide (conseiller sans compte). */
  readonly cepDossierId?: string;
}
