import { Injectable } from "@nestjs/common";

import { HabilitationRepository } from "./habilitation.repository.js";
import type { Habilitation } from "./habilitation.types.js";

@Injectable()
export class HabilitationService {
  constructor(private readonly habilitations: HabilitationRepository) {}

  findActivesByAccountId(accountId: string): Promise<Habilitation[]> {
    return this.habilitations.findActivesByAccountId(accountId);
  }
}
