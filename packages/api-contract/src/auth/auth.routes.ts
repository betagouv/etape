import type { RouteDefinition } from "../route-definition.js";
import { RefreshSessionResponseSchema, SessionResponseSchema } from "./auth.schemas.js";

/**
 * Les routes d'authentification qui répondent en JSON. Les autres (`login`,
 * `callback`, `logout`) sont des navigations pleine page qui redirigent.
 *
 * Une simple lecture : elle ne compte pas comme une activité, pour que le front
 * puisse relire l'échéance avant d'avertir sans la repousser.
 */
export const getSession = {
  method: "GET",
  path: "/auth/session",
  response: SessionResponseSchema,
} as const satisfies RouteDefinition;

/**
 * Signale une activité et renvoie la session prolongée : la fin d'inactivité
 * est repoussée, jamais la fin absolue. Toute requête authentifiée en fait
 * autant ; celle-ci sert quand l'activité ne passe pas par l'API (mouvement,
 * saisie, navigation dans l'app, « Oui » du dialogue).
 */
export const refreshSession = {
  method: "POST",
  path: "/auth/session/refresh",
  response: RefreshSessionResponseSchema,
} as const satisfies RouteDefinition;
