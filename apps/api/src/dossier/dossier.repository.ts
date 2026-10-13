import type { CibleDossier } from "../authorization/authorization.types.js";
import type { Transaction } from "../database/transaction.types.js";

export abstract class DossierRepository {
  /**
   * Ce qu'il faut savoir d'un dossier pour appliquer la matrice : région,
   * bénéficiaire, statut, membres de sa commission.
   *
   * Lu dans la transaction de l'appelant, donc sous son contexte RLS : `null`
   * si le dossier n'existe pas OU s'il est hors du périmètre de l'acteur. Les
   * deux cas donnent un 404, pour ne pas révéler l'existence d'un dossier.
   */
  abstract findCibleById(tx: Transaction, dossierId: string): Promise<CibleDossier | null>;
}
