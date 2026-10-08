import { describe, expect, it } from "vitest";

import { validateEnv } from "./env.js";

const validEnv = {
  FRONT_OFFICE_BASE_URL: "http://localhost:5173",
  FRONT_OFFICE_API_BASE_URL: "http://localhost:5173/api",
  FRONT_OFFICE_KEYCLOAK_CLIENT_SECRET: "secret-fo",
  BACK_OFFICE_BASE_URL: "http://localhost:5174",
  BACK_OFFICE_API_BASE_URL: "http://localhost:5174/api",
  BACK_OFFICE_KEYCLOAK_CLIENT_SECRET: "secret-bo",
  KEYCLOAK_URL: "http://localhost:8080",
  KEYCLOAK_CLIENT_ID: "etape-api",
  COOKIE_ENCRYPTION_KEY: Buffer.alloc(32).toString("base64"),
  DATABASE_URL: "postgresql://etape:etape@localhost:5432/etape",
};

describe("validateEnv", () => {
  it("accepte une configuration complète", () => {
    expect(validateEnv(validEnv).BACK_OFFICE_BASE_URL).toBe("http://localhost:5174");
  });

  it("refuse deux fronts sur le même hôte", () => {
    expect(() =>
      validateEnv({
        ...validEnv,
        BACK_OFFICE_BASE_URL: "http://localhost:5173",
        BACK_OFFICE_API_BASE_URL: "http://localhost:5173/api",
      }),
    ).toThrow(/BACK_OFFICE_BASE_URL : même hôte/);
  });

  it("refuse une API servie hors de l'origine de son front", () => {
    expect(() =>
      validateEnv({ ...validEnv, FRONT_OFFICE_API_BASE_URL: "http://localhost:3002/api" }),
    ).toThrow(/FRONT_OFFICE_API_BASE_URL : origine différente/);
  });
});
