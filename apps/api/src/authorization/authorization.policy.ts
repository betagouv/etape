import { ForbiddenException } from "@nestjs/common";

import type { Action } from "./action.enum.js";
import type { Actor, CibleOf, Regle } from "./authorization.types.js";
import { MATRICE_DROITS } from "./matrice-droits.js";
import { PORTEE } from "./portee.enum.js";
import { matchesPortee, matchesStatuts } from "./portee.js";

function reglesOf(action: Action): readonly Regle[] {
  return MATRICE_DROITS[action];
}

/**
 * La décision : vrai si au moins une règle de l'action s'applique à cet
 * acteur, sur cette cible, dans cet état. Fonction pure, testable sans base.
 */
export function can<A extends Action>(actor: Actor, action: A, cible: CibleOf<A>): boolean {
  return reglesOf(action).some(
    (regle) => matchesPortee(regle, actor, cible) && matchesStatuts(regle, cible),
  );
}

/** Pour les services : lève 403 si l'action n'est pas permise. */
export function assertCan<A extends Action>(actor: Actor, action: A, cible: CibleOf<A>): void {
  if (!can(actor, action, cible)) throw new ForbiddenException();
}

/**
 * Pré-filtre du guard, avant de charger la cible : l'acteur figure-t-il dans
 * au moins une règle de l'action ? Un bénéficiaire passe si une règle
 * « propriétaire » existe ; un admin est arrêté net sur `piece:validate`.
 * Ne remplace jamais `assertCan`, qui regarde la cible.
 */
export function mayAttempt(actor: Actor, action: Action): boolean {
  return reglesOf(action).some(
    (regle) =>
      regle.portee === PORTEE.PROPRIETAIRE ||
      actor.habilitations.some((habilitation) => habilitation.type === regle.role),
  );
}
