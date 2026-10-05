import type { RouteDefinition } from "../route-definition.js";
import { SessionResponseSchema } from "./auth.schemas.js";

/**
 * Seule route d'authentification du contrat : les autres (`login`, `callback`,
 * `logout`) sont des navigations pleine page qui redirigent, sans réponse JSON
 * à valider.
 */
export const getSession = {
  method: "GET",
  path: "/auth/session",
  response: SessionResponseSchema,
} as const satisfies RouteDefinition;
