import type { RouteDefinition } from "../route-definition.js";
import {
  SearchAppellationsRomeQuerySchema,
  SearchAppellationsRomeResponseSchema,
} from "./metier-rome.schemas.js";

export const searchAppellationsRome = {
  method: "GET",
  path: "/appellation-rome",
  query: SearchAppellationsRomeQuerySchema,
  response: SearchAppellationsRomeResponseSchema,
} as const satisfies RouteDefinition;
