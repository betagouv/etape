import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

import type { AuthorizedRequest } from "./authorization.guard.js";
import type { Actor } from "./authorization.types.js";

/** Injecte dans le contrôleur l'acteur résolu par `AuthorizationGuard`. */
export const CurrentActor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Actor =>
    context.switchToHttp().getRequest<AuthorizedRequest>().actor,
);
