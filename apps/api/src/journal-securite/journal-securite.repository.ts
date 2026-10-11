import type { Transaction } from "../database/transaction.types.js";
import type { EntreeJournal } from "./journal-securite.types.js";

export abstract class JournalSecuriteRepository {
  /**
   * Écrit dans la transaction de l'appelant : l'action et sa trace sont
   * enregistrées ensemble, ou pas du tout.
   */
  abstract record(tx: Transaction, entree: EntreeJournal): Promise<void>;
}
