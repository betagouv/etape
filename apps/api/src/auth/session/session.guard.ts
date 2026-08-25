import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";

import { SessionService } from "./session.service.js";
import type { UserSession } from "./session.types.js";

/** Requête à laquelle le garde a rattaché la session résolue. */
export interface AuthenticatedRequest extends Request {
  session: UserSession;
}

/**
 * Exige une session valide et la rattache à la requête.
 *
 * À poser sur les routes qui manipuleront le dossier d'une personne, quand la
 * persistance arrivera. Rien ne l'utilise encore : il est là pour que la
 * question « comment je protège cette route ? » ait déjà une réponse évidente le
 * jour où elle se pose, plutôt qu'une relecture de cookie réinventée sur place.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const session = await this.sessions.readSession(request);

    if (!session) throw new UnauthorizedException();

    (request as AuthenticatedRequest).session = session;
    return true;
  }
}
