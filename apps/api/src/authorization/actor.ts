import type { RlsContext } from "../database/transaction.types.js";
import { HABILITATION_TYPE } from "../habilitation/habilitation.enum.js";
import type { Habilitation } from "../habilitation/habilitation.types.js";
import type { Actor } from "./authorization.types.js";

export function buildActor(accountId: string, habilitations: readonly Habilitation[]): Actor {
  return { accountId, habilitations };
}

/**
 * Le contexte RLS d'un acteur : son compte (policy propriétaire) et les
 * régions de toutes ses habilitations régionales.
 *
 * La RLS ne connaît que la région : un admin voit donc, en base, les dossiers
 * de sa région. C'est la matrice qui lui refuse l'instruction ; la RLS n'est
 * que le filet si un service oubliait `assertCan`.
 */
export function toRlsContext(actor: Actor): RlsContext {
  const regionIds = new Set<string>();
  for (const habilitation of actor.habilitations) {
    if (habilitation.type !== HABILITATION_TYPE.SUPER_ADMIN) regionIds.add(habilitation.regionId);
  }
  return { accountId: actor.accountId, regionIds: [...regionIds] };
}
