import type { RouteDefinition } from "../route-definition.js";
import { SecteursActiviteResponseSchema } from "./secteur-activite.schemas.js";

/** Les 732 sous-classes de la NAF rév. 2, à filtrer par le front. */
export const getSecteursActivite = {
  method: "GET",
  path: "/secteur-activite",
  response: SecteursActiviteResponseSchema,
} as const satisfies RouteDefinition;
