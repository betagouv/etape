import { MisdirectedException, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { describe, expect, it } from "vitest";

import { FRONT, type Front, type FrontConfig } from "./front.js";
import { FrontGuard, type FrontRequest } from "./front.guard.js";

const fronts: Record<Front, FrontConfig> = {
  [FRONT.FRONT_OFFICE]: {
    frontBaseUrl: "http://localhost:5173",
    apiBaseUrl: "http://localhost:5173/api",
    keycloakIssuerUrl: "http://localhost:8080/realms/etape",
    keycloakClientSecret: "secret-fo",
  },
  [FRONT.BACK_OFFICE]: {
    frontBaseUrl: "http://localhost:5174",
    apiBaseUrl: "http://localhost:5174/api",
    keycloakIssuerUrl: "http://localhost:8080/realms/etape-back-office",
    keycloakClientSecret: "secret-bo",
  },
};

function createContext(headers: Record<string, string>): {
  context: ExecutionContext;
  request: Request;
} {
  const request = { headers } as Request;
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as ExecutionContext;

  return { context, request };
}

describe("FrontGuard", () => {
  const guard = new FrontGuard(fronts);

  it("rattache le front reconnu à la requête", () => {
    const { context, request } = createContext({ host: "localhost:5174" });

    expect(guard.canActivate(context)).toBe(true);
    expect((request as FrontRequest).front).toBe(FRONT.BACK_OFFICE);
  });

  it("refuse un hôte inconnu en 421", () => {
    const { context } = createContext({ host: "evil.example" });

    expect(() => guard.canActivate(context)).toThrow(MisdirectedException);
  });

  it("ne lit pas X-Forwarded-Host", () => {
    const forged = createContext({ host: "evil.example", "x-forwarded-host": "localhost:5173" });
    expect(() => guard.canActivate(forged.context)).toThrow(MisdirectedException);

    const ignored = createContext({ host: "localhost:5173", "x-forwarded-host": "localhost:5174" });
    guard.canActivate(ignored.context);
    expect((ignored.request as FrontRequest).front).toBe(FRONT.FRONT_OFFICE);
  });
});
