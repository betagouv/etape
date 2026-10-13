import { type ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { describe, expect, it } from "vitest";

import { HABILITATION_TYPE } from "../habilitation/habilitation.enum.js";
import type { HabilitationService } from "../habilitation/habilitation.service.js";
import type { Habilitation } from "../habilitation/habilitation.types.js";
import { ACTION, type Action } from "./action.enum.js";
import { AuthorizationGuard, type AuthorizedRequest } from "./authorization.guard.js";
import { RequireAction } from "./require-action.decorator.js";

class Routes {
  @RequireAction(ACTION.PIECE_VALIDATE)
  validatePiece(): void {}

  sansAction(): void {}
}

function contextFor(handler: keyof Routes, request: Partial<AuthorizedRequest>): ExecutionContext {
  return {
    getHandler: () => Routes.prototype[handler],
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function guardWith(habilitations: Habilitation[]): AuthorizationGuard {
  const service = {
    findActivesByAccountId: async () => habilitations,
  } as unknown as HabilitationService;
  return new AuthorizationGuard(new Reflector(), service);
}

const session = { accountId: "ines" } as AuthorizedRequest["session"];

describe("AuthorizationGuard", () => {
  it("fermé par défaut : 403 sur une route gardée sans @RequireAction", async () => {
    const guard = guardWith([]);
    await expect(guard.canActivate(contextFor("sansAction", { session }))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("403 si l'acteur ne figure dans aucune règle de l'action", async () => {
    const guard = guardWith([{ type: HABILITATION_TYPE.ADMIN, accountId: "ines", regionId: "93" }]);
    await expect(guard.canActivate(contextFor("validatePiece", { session }))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("rattache l'acteur à la requête sinon", async () => {
    const request: Partial<AuthorizedRequest> = { session };
    const guard = guardWith([
      { type: HABILITATION_TYPE.INSTRUCTEUR, accountId: "ines", regionId: "93" },
    ]);

    await expect(guard.canActivate(contextFor("validatePiece", request))).resolves.toBe(true);
    expect(request.actor?.habilitations).toHaveLength(1);
  });

  it("l'action déclarée est typée", () => {
    const action: Action | undefined = new Reflector().get(
      RequireAction,
      Routes.prototype.validatePiece,
    );
    expect(action).toBe(ACTION.PIECE_VALIDATE);
  });
});
