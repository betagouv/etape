import { Injectable } from "@nestjs/common";

import type { Habilitation } from "./habilitation.js";
import { HabilitationRepository } from "./habilitation.repository.js";

@Injectable()
export class HabilitationService {
  constructor(private readonly habilitations: HabilitationRepository) {}

  findActivesByAccountId(accountId: string): Promise<Habilitation[]> {
    return this.habilitations.findActivesByAccountId(accountId);
  }
}
