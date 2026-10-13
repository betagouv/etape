import { Reflector } from "@nestjs/core";

import type { Action } from "./action.enum.js";

/**
 * Déclare l'action qu'une route exécute ; lu par `AuthorizationGuard`.
 * `Reflector.createDecorator` type la métadonnée : `reflector.get(RequireAction, …)`
 * renvoie une `Action`, sans clé en chaîne ni transtypage.
 */
export const RequireAction = Reflector.createDecorator<Action>();
