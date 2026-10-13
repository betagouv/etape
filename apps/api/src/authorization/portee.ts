import { HABILITATION_TYPE } from "../habilitation/habilitation.enum.js";
import type { HabilitationAvecRegion } from "../habilitation/habilitation.types.js";
import type { Actor, Cible, Regle, RoleRegional } from "./authorization.types.js";
import { PORTEE } from "./portee.enum.js";

/**
 * La règle s'applique-t-elle à ce couple acteur / cible ? Ne regarde que la
 * relation (propriétaire, région, commission, national), pas le statut :
 * voir `matchesStatuts`.
 *
 * Le `switch` n'a pas de `default` : ajouter une portée sans la traiter ici
 * ne compile plus (le type de retour `boolean` exige un retour partout).
 */
export function matchesPortee(regle: Regle, actor: Actor, cible: Cible): boolean {
  switch (regle.portee) {
    case PORTEE.PROPRIETAIRE:
      // Pas d'habilitation : le bénéficiaire est reconnu par la relation au dossier.
      return cible.type === "dossier" && cible.beneficiaireId === actor.accountId;

    case PORTEE.REGION:
      // Le rôle ET la région sur la même habilitation (voir hasHabilitationInRegion).
      return hasHabilitationInRegion(actor, regle.role, cible.regionId);

    case PORTEE.COMMISSION:
      // Habilité dans la région du dossier, et membre en exercice de SA commission.
      return (
        cible.type === "dossier" &&
        hasHabilitationInRegion(actor, regle.role, cible.regionId) &&
        cible.membreCommissionIds.includes(actor.accountId)
      );

    case PORTEE.NATIONAL:
      return actor.habilitations.some(
        (habilitation) => habilitation.type === HABILITATION_TYPE.SUPER_ADMIN,
      );
  }
}

/** Une règle sans statut vaut pour tous ; avec statuts, seulement pour un dossier dans l'un d'eux. */
export function matchesStatuts(regle: Regle, cible: Cible): boolean {
  if (!("statuts" in regle) || regle.statuts === undefined) return true;
  return cible.type === "dossier" && regle.statuts.includes(cible.statut);
}

/**
 * Vrai si UNE MÊME habilitation porte ce rôle et cette région.
 *
 * Tester le rôle d'un côté et la région de l'autre serait une faille : Paul,
 * instructeur en Nouvelle-Aquitaine et admin en PACA, a « un rôle instructeur »
 * et « un accès à PACA », mais n'est pas instructeur en PACA.
 */
export function hasHabilitationInRegion(
  actor: Actor,
  role: RoleRegional,
  regionId: string,
): boolean {
  return actor.habilitations.some(
    (habilitation) =>
      isHabilitationAvecRegion(habilitation) &&
      habilitation.type === role &&
      habilitation.regionId === regionId,
  );
}

function isHabilitationAvecRegion(
  habilitation: Actor["habilitations"][number],
): habilitation is HabilitationAvecRegion {
  return habilitation.type !== HABILITATION_TYPE.SUPER_ADMIN;
}
