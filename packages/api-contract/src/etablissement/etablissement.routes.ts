import type { RouteDefinition } from "../route-definition.js";
import {
  SearchEtablissementsQuerySchema,
  SearchEtablissementsResponseSchema,
} from "./etablissement.schemas.js";

export const searchEtablissements = {
  method: "GET",
  path: "/etablissement",
  query: SearchEtablissementsQuerySchema,
  response: SearchEtablissementsResponseSchema,
} as const satisfies RouteDefinition;
