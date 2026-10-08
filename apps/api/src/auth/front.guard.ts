import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Inject,
  Injectable,
  MisdirectedException,
} from "@nestjs/common";
import type { Request } from "express";

import { FRONT_CONFIGS, resolveFrontByHost, type Front, type FrontConfig } from "./front.js";

/** Requête dont la garde a reconnu le front. */
export interface FrontRequest extends Request {
  front: Front;
}

/**
 * Refuse toute requête dont l'en-tête `Host` ne désigne aucun front configuré
 * (421 Misdirected Request), sans redirection : un hôte inconnu n'a pas de front
 * vers lequel revenir. Globale, elle couvre aussi les routes à venir.
 */
@Injectable()
export class FrontGuard implements CanActivate {
  constructor(@Inject(FRONT_CONFIGS) private readonly fronts: Record<Front, FrontConfig>) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const front = resolveFrontByHost(request.headers.host, this.fronts);

    if (!front) throw new MisdirectedException("Hôte inconnu.");

    (request as FrontRequest).front = front;
    return true;
  }
}

/** Le front reconnu par `FrontGuard`. */
export const CurrentFront = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Front =>
    context.switchToHttp().getRequest<FrontRequest>().front,
);
