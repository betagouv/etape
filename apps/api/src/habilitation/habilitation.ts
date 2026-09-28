import { HABILITATION_TYPE } from "./habilitation.enum.js";

/**
 * Habilitation résolue pour un compte : une par rôle cumulé, jamais la
 * session brute. Bénéficiaire n'y figure pas — ce n'est pas une habilitation
 * de compte mais une propriété du dossier (`dossier.beneficiaireId`).
 * Accompagnant CEP non plus — accès par jeton, hors de ce système.
 */
export type Habilitation =
  | {
      readonly type: typeof HABILITATION_TYPE.INSTRUCTEUR;
      readonly accountId: string;
      readonly regionId: string;
    }
  | {
      readonly type: typeof HABILITATION_TYPE.ADMIN;
      readonly accountId: string;
      readonly regionId: string;
    }
  | { readonly type: typeof HABILITATION_TYPE.SUPER_ADMIN; readonly accountId: string };

/**
 * `superAdmin` n'a jamais de `regionId` : cette garde empêche, par
 * construction du type, qu'un accès dossier se glisse dans un test qui ne
 * visait que le rôle.
 */
export function hasRegionAccess(habilitations: readonly Habilitation[], regionId: string): boolean {
  return habilitations.some(
    (habilitation) =>
      habilitation.type !== HABILITATION_TYPE.SUPER_ADMIN && habilitation.regionId === regionId,
  );
}
