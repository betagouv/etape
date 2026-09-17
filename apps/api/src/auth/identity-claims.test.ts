import { describe, expect, it } from "vitest";

import { extractIdentityClaims, getStringClaim } from "./identity-claims.js";

describe("extractIdentityClaims", () => {
  it("écarte la plomberie du protocole et garde l'identité", () => {
    const claims = extractIdentityClaims({
      iss: "https://auth.etape.test/realms/etape",
      aud: "etape-api",
      exp: 1,
      iat: 1,
      nonce: "nonce",
      sid: "sid",
      sub: "sub",
      given_name: "Camille",
      family_name: "Martin",
      birthdate: "1990-01-01",
      identity_provider: "franceconnect",
    });

    expect(claims).toEqual({
      given_name: "Camille",
      family_name: "Martin",
      birthdate: "1990-01-01",
      identity_provider: "franceconnect",
    });
  });

  it("écarte les valeurs absentes", () => {
    expect(
      extractIdentityClaims({ email: null, gender: undefined, email_verified: false }),
    ).toEqual({ email_verified: false });
  });
});

describe("getStringClaim", () => {
  it("renvoie une chaîne non vide", () => {
    expect(getStringClaim("camille@exemple.test")).toBe("camille@exemple.test");
  });

  it("ignore une chaîne vide ou un autre type", () => {
    expect(getStringClaim("")).toBeUndefined();
    expect(getStringClaim(42)).toBeUndefined();
    expect(getStringClaim(null)).toBeUndefined();
  });
});
