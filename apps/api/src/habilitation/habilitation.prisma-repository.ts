import { Injectable } from "@nestjs/common";

import { PrismaService } from "../database/prisma.service.js";
import type { Role } from "../generated/prisma/client.ts";
import type { Habilitation } from "./habilitation.js";
import { HabilitationRepository } from "./habilitation.repository.js";
import { HABILITATION_TYPE } from "./habilitation.enum.js";

interface LigneHabilitation {
  accountId: string;
  role: Role;
  regionId: string | null;
}

@Injectable()
export class PrismaHabilitationRepository extends HabilitationRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findActivesByAccountId(accountId: string): Promise<Habilitation[]> {
    const lignes = await this.prisma.habilitation.findMany({
      where: { accountId, dateRevocation: null },
      select: { accountId: true, role: true, regionId: true },
    });

    return lignes.map(toHabilitation);
  }
}

function toHabilitation(ligne: LigneHabilitation): Habilitation {
  switch (ligne.role) {
    case "INSTRUCTEUR":
      return {
        type: HABILITATION_TYPE.INSTRUCTEUR,
        accountId: ligne.accountId,
        regionId: requireRegionId(ligne),
      };
    case "ADMIN":
      return {
        type: HABILITATION_TYPE.ADMIN,
        accountId: ligne.accountId,
        regionId: requireRegionId(ligne),
      };
    case "SUPER_ADMIN":
      return { type: HABILITATION_TYPE.SUPER_ADMIN, accountId: ligne.accountId };
  }
}

function requireRegionId(ligne: LigneHabilitation): string {
  if (!ligne.regionId) {
    throw new Error(`Habilitation ${ligne.role} sans region_id pour le compte ${ligne.accountId}.`);
  }
  return ligne.regionId;
}
