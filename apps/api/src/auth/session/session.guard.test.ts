import { UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { FRONT } from "../front.js";
import type { FrontRequest } from "../front.guard.js";
import { SessionGuard, type AuthenticatedRequest } from "./session.guard.js";
import type { SessionService } from "./session.service.js";
import type { AccountSession } from "./session.types.js";

const session: AccountSession & { id: string } = {
  id: "5f0c8a52-6f0e-4f7a-9a39-1f1b8a6f2c11",
  sub: "sub",
  accountId: "account-id",
  front: FRONT.FRONT_OFFICE,
  identityProvider: "keycloak",
  claims: {},
  idToken: "id-token",
  expiresAt: 2_000,
  idleExpiresAt: 1_000,
};

function createContext(request: Partial<FrontRequest>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function createGuard(readSession: SessionService["readSession"]): {
  guard: SessionGuard;
  recordActivity: ReturnType<typeof vi.fn>;
} {
  const recordActivity = vi.fn(async (current: AccountSession) => ({
    ...current,
    idleExpiresAt: 9_000,
  }));
  const sessions = { readSession, recordActivity } as unknown as SessionService;

  return { guard: new SessionGuard(sessions), recordActivity };
}

describe("SessionGuard", () => {
  it("refuse une requête sans session", async () => {
    const { guard, recordActivity } = createGuard(async () => null);

    await expect(guard.canActivate(createContext({ front: FRONT.FRONT_OFFICE }))).rejects.toThrow(
      UnauthorizedException,
    );
    expect(recordActivity).not.toHaveBeenCalled();
  });

  it("compte la requête comme une activité et rattache la session prolongée", async () => {
    const { guard, recordActivity } = createGuard(async () => session);
    const request: Partial<FrontRequest> = { front: FRONT.FRONT_OFFICE };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);

    expect(recordActivity).toHaveBeenCalledWith(session);
    expect((request as unknown as AuthenticatedRequest).session.idleExpiresAt).toBe(9_000);
  });
});
