import type { RouteDefinition } from "../route-definition.js";
import {
  SearchCertificationsQuerySchema,
  SearchCertificationsResponseSchema,
} from "./certification.schemas.js";

export const searchCertifications = {
  method: "GET",
  path: "/certification",
  query: SearchCertificationsQuerySchema,
  response: SearchCertificationsResponseSchema,
} as const satisfies RouteDefinition;
