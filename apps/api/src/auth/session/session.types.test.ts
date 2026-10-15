import { describe, expect, it } from "vitest";

import { FRONT } from "../front.js";
import { toSessionResponse, type AccountSession } from "./session.types.js";

const FRANCECONNECT_ALIAS = "franceconnect";

function buildSession(overrides: Partial<AccountSession> = {}): AccountSession {
  return {
    sub: "sub",
    accountId: "account-id",
    front: FRONT.FRONT_OFFICE,
    email: "camille.martin@exemple.fr",
    identityProvider: "keycloak",
    claims: { given_name: "Camille" },
    idToken: "id-token",
    expiresAt: 0,
    ...overrides,
  };
}

describe("toSessionResponse", () => {
  it("répond une session nulle quand personne n'est connecté", () => {
    expect(toSessionResponse(null, FRANCECONNECT_ALIAS)).toEqual({ session: null });
  });

  it("expose la session sans jeton ni identifiant interne", () => {
    const response = toSessionResponse(buildSession(), FRANCECONNECT_ALIAS);

    expect(response).toEqual({
      session: {
        sub: "sub",
        email: "camille.martin@exemple.fr",
        isFranceConnectSession: false,
        claims: { given_name: "Camille" },
      },
    });
  });

  it("reconnaît une session ouverte par FranceConnect", () => {
    const response = toSessionResponse(
      buildSession({ identityProvider: FRANCECONNECT_ALIAS }),
      FRANCECONNECT_ALIAS,
    );

    expect(response.session?.isFranceConnectSession).toBe(true);
  });
});
