import type { z } from "zod";

export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

export interface RouteDefinition {
  method: HttpMethod;
  path: string;
  params?: z.ZodType;
  query?: z.ZodType;
  body?: z.ZodType;
  response: z.ZodType;
}

export type RouteParams<T extends RouteDefinition> = T["params"] extends z.ZodType
  ? z.infer<T["params"]>
  : never;

export type RouteQuery<T extends RouteDefinition> = T["query"] extends z.ZodType
  ? z.infer<T["query"]>
  : never;

export type RouteBody<T extends RouteDefinition> = T["body"] extends z.ZodType
  ? z.infer<T["body"]>
  : never;

export type RouteResponse<T extends RouteDefinition> = z.infer<T["response"]>;
