import type { Habilitation } from "./habilitation.types.js";

export abstract class HabilitationRepository {
  /** Habilitations non révoquées (`date_revocation IS NULL`). */
  abstract findActivesByAccountId(accountId: string): Promise<Habilitation[]>;
}
