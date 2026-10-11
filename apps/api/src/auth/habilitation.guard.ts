import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { Habilitation } from "../habilitation/habilitation.js";
import { HabilitationService } from "../habilitation/habilitation.service.js";
import { ROLES_KEY, type RoleRequis } from "./roles.decorator.js";
import type { AuthenticatedRequest } from "./session/session.guard.js";

/** Requête à laquelle `HabilitationGuard` a rattaché les habilitations résolues. */
export interface RequestAvecHabilitations extends AuthenticatedRequest {
  habilitations: Habilitation[];
}

/**
 * S'enchaîne après `SessionGuard`. Rejet rapide par rôle seul (403) ; le
 * filtrage fin par région reste au service métier, qui reçoit `habilitations`
 * en paramètre — jamais la session brute (`architecture-api.md`, décision 1).
 */
@Injectable()
export class HabilitationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly habilitationService: HabilitationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rolesRequis = this.reflector.get<RoleRequis[] | undefined>(
      ROLES_KEY,
      context.getHandler(),
    );
    if (!rolesRequis || rolesRequis.length === 0) return true;

    const request = context.switchToHttp().getRequest<RequestAvecHabilitations>();
    const habilitations = await this.habilitationService.findActivesByAccountId(
      request.session.accountId,
    );

    const aUnRoleRequis = habilitations.some((habilitation) =>
      rolesRequis.includes(habilitation.type),
    );
    if (!aUnRoleRequis) throw new ForbiddenException();

    request.habilitations = habilitations;
    return true;
  }
}
