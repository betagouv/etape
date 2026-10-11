import type { RlsContext, Transaction } from "./transaction.types.js";

/**
 * Ouvre une transaction dont la première instruction pose le contexte RLS.
 * Toute lecture ou écriture d'une table sous RLS passe par là.
 *
 * Abstraite pour que le service n'importe pas Prisma, et remplaçable par un
 * faux dans les tests unitaires.
 */
export abstract class TransactionRunner {
  abstract run<T>(context: RlsContext, work: (tx: Transaction) => Promise<T>): Promise<T>;
}
