import { Injectable } from "@nestjs/common";

import { PrismaService } from "../database/prisma.service.js";
import { Role } from "../generated/prisma/enums.ts";
import { HABILITATION_TYPE } from "./habilitation.enum.js";
import { HabilitationRepository } from "./habilitation.repository.js";
import type { Habilitation } from "./habilitation.types.js";

interface LigneHabilitation {
  accountId: string;
  role: Role;
  regionId: string | null;
}

/**
 * La table `habilitation` n'a pas de RLS : elle est lue pour établir le
 * contexte RLS de la requête, avant qu'il existe.
 */
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

/** Traduction base → domaine. La contrainte CHECK garantit déjà la cohérence rôle / région. */
function toHabilitation(ligne: LigneHabilitation): Habilitation {
  switch (ligne.role) {
    case Role.INSTRUCTEUR:
      return {
        type: HABILITATION_TYPE.INSTRUCTEUR,
        accountId: ligne.accountId,
        regionId: requireRegionId(ligne),
      };
    case Role.ADMIN:
      return {
        type: HABILITATION_TYPE.ADMIN,
        accountId: ligne.accountId,
        regionId: requireRegionId(ligne),
      };
    case Role.MEMBRE_COMMISSION:
      return {
        type: HABILITATION_TYPE.MEMBRE_COMMISSION,
        accountId: ligne.accountId,
        regionId: requireRegionId(ligne),
      };
    case Role.SUPER_ADMIN:
      return { type: HABILITATION_TYPE.SUPER_ADMIN, accountId: ligne.accountId };
  }
}

function requireRegionId(ligne: LigneHabilitation): string {
  if (!ligne.regionId) {
    throw new Error(`Habilitation ${ligne.role} sans region_id pour le compte ${ligne.accountId}.`);
  }
  return ligne.regionId;
}
