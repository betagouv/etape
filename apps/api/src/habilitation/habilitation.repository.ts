import type { Habilitation } from "./habilitation.js";

export abstract class HabilitationRepository {
  abstract findActivesByAccountId(accountId: string): Promise<Habilitation[]>;
}
