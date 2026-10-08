import { describe, expect, it } from "vitest";

import { FRONT, resolveFrontByHost, type Front, type FrontConfig } from "./front.js";

const fronts: Record<Front, FrontConfig> = {
  [FRONT.FRONT_OFFICE]: {
    frontBaseUrl: "https://etape.example.org",
    apiBaseUrl: "https://etape.example.org/api",
    keycloakIssuerUrl: "https://auth.example.org/realms/etape",
    keycloakClientSecret: "secret-fo",
  },
  [FRONT.BACK_OFFICE]: {
    frontBaseUrl: "http://localhost:5174",
    apiBaseUrl: "http://localhost:5174/api",
    keycloakIssuerUrl: "https://auth.example.org/realms/etape-back-office",
    keycloakClientSecret: "secret-bo",
  },
};

describe("resolveFrontByHost", () => {
  it("reconnaît chaque front à son hôte", () => {
    expect(resolveFrontByHost("etape.example.org", fronts)).toBe(FRONT.FRONT_OFFICE);
    expect(resolveFrontByHost("localhost:5174", fronts)).toBe(FRONT.BACK_OFFICE);
  });

  it("ignore la casse, comme le DNS", () => {
    expect(resolveFrontByHost("ETAPE.Example.org", fronts)).toBe(FRONT.FRONT_OFFICE);
  });

  it("tient compte du port", () => {
    expect(resolveFrontByHost("localhost:5173", fronts)).toBeNull();
    expect(resolveFrontByHost("localhost", fronts)).toBeNull();
  });

  it("refuse un hôte inconnu ou absent", () => {
    expect(resolveFrontByHost("evil.example", fronts)).toBeNull();
    expect(resolveFrontByHost("etape.example.org.evil.example", fronts)).toBeNull();
    expect(resolveFrontByHost("", fronts)).toBeNull();
    expect(resolveFrontByHost(undefined, fronts)).toBeNull();
  });
});
