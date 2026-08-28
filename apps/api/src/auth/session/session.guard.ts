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
 * Rien ne l'utilise encore : il attend les routes qui manipuleront le dossier
 * d'une personne, pour qu'on n'y réinvente pas une relecture de cookie.
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
