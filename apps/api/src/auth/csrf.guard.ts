import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";
import type { Request } from "express";

import { FRONT_CONFIGS, type Front, type FrontConfig } from "./front.js";
import type { FrontRequest } from "./front.guard.js";

// Copié dans `packages/api-client/src/csrf.ts`, qu'envoie `createHttpClient` :
// toute modification ici doit y être reportée.
export const CSRF_HEADER = "x-etape-csrf";
export const CSRF_HEADER_VALUE = "1";

/** Méthodes qui ne modifient rien : la garde les laisse passer. */
const SAFE_METHODS: ReadonlySet<string> = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Garde CSRF des requêtes qui modifient des données, en deux vérifications.
 *
 * **L'en-tête maison.** Une page d'un autre site ne peut pas l'ajouter sans
 * demander la permission au serveur (requête préalable CORS), et l'API ne la
 * donne jamais : elle n'active pas le CORS.
 *
 * **`Origin`.** Les navigateurs l'envoient sur toute requête qui n'est ni GET ni
 * HEAD, même vers leur propre origine ; il doit être celle du front reconnu par
 * `Host`. Il tient encore si le CORS est un jour ouvert par erreur, là où
 * l'en-tête maison ne suffirait plus.
 *
 * Un outil comme `curl` n'envoie pas `Origin`, et est donc refusé ; il n'a pas
 * non plus les cookies d'une victime, et le CSRF ne concerne que les
 * navigateurs.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(@Inject(FRONT_CONFIGS) private readonly fronts: Record<Front, FrontConfig>) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(request.method)) return true;

    if (request.headers[CSRF_HEADER] !== CSRF_HEADER_VALUE) {
      throw new ForbiddenException("En-tête anti-CSRF absent.");
    }

    // `FrontGuard`, global et placé avant, a déjà reconnu le front.
    const { front } = request as FrontRequest;
    if (request.headers.origin !== new URL(this.fronts[front].frontBaseUrl).origin) {
      throw new ForbiddenException("Origine non autorisée.");
    }

    return true;
  }
}
