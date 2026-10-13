import type { HABILITATION_TYPE } from "./habilitation.enum.js";

/** Habilitation régionale : le rôle ne vaut que pour cette région. */
interface HabilitationRegionale<Type> {
  readonly type: Type;
  readonly accountId: string;
  /** Code INSEE de la région. */
  readonly regionId: string;
}

/**
 * Habilitation active résolue pour un compte, une par rôle cumulé. Union
 * discriminée : un `superAdmin` n'a jamais de `regionId`, par construction du
 * type. Aucun code d'autorisation ne peut donc lui prêter un accès régional.
 */
export type Habilitation =
  | HabilitationRegionale<typeof HABILITATION_TYPE.INSTRUCTEUR>
  | HabilitationRegionale<typeof HABILITATION_TYPE.ADMIN>
  | HabilitationRegionale<typeof HABILITATION_TYPE.MEMBRE_COMMISSION>
  | { readonly type: typeof HABILITATION_TYPE.SUPER_ADMIN; readonly accountId: string };

/** Les variantes d'`Habilitation` qui portent une région. */
export type HabilitationAvecRegion = Extract<Habilitation, { regionId: string }>;
