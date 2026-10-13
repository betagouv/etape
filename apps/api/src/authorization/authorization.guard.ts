import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { AuthenticatedRequest } from "../auth/session/session.guard.js";
import { HabilitationService } from "../habilitation/habilitation.service.js";
import { buildActor } from "./actor.js";
import { mayAttempt } from "./authorization.policy.js";
import type { Actor } from "./authorization.types.js";
import { RequireAction } from "./require-action.decorator.js";

/** Requête à laquelle `AuthorizationGuard` a rattaché l'acteur. */
export interface AuthorizedRequest extends AuthenticatedRequest {
  actor: Actor;
}

/**
 * S'enchaîne après `SessionGuard` : `@UseGuards(SessionGuard, AuthorizationGuard)`.
 *
 * 1. Lit l'action déclarée par `@RequireAction` sur la route.
 * 2. Relit les habilitations actives du compte, à chaque requête : une
 *    révocation prend effet à la requête suivante, sans attendre la fin de session.
 * 3. Arrête tôt (403) un acteur qui ne figure dans aucune règle de l'action.
 * 4. Rattache l'acteur à la requête ; le service décidera avec la cible.
 */
@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly habilitations: HabilitationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const action = this.reflector.get(RequireAction, context.getHandler());
    // Fermé par défaut : une route gardée sans action déclarée n'est ouverte à personne.
    if (!action) throw new ForbiddenException();

    const request = context.switchToHttp().getRequest<AuthorizedRequest>();
    const habilitations = await this.habilitations.findActivesByAccountId(
      request.session.accountId,
    );
    const actor = buildActor(request.session.accountId, habilitations);

    if (!mayAttempt(actor, action)) throw new ForbiddenException();

    request.actor = actor;
    return true;
  }
}
