import { describe, expect, it } from "vitest";

import { FRONT } from "../front.js";
import { SESSION_POLICY_BY_FRONT } from "./session-policy.js";
import { toSessionResponse, type AccountSession } from "./session.types.js";

const FRANCECONNECT_ALIAS = "franceconnect";
const NOW = 1_000_000;

function buildSession(overrides: Partial<AccountSession> = {}): AccountSession {
  return {
    sub: "sub",
    accountId: "account-id",
    front: FRONT.FRONT_OFFICE,
    email: "camille.martin@exemple.fr",
    identityProvider: "keycloak",
    claims: { given_name: "Camille" },
    idToken: "id-token",
    expiresAt: NOW + 10 * 60 * 60 * 1000,
    idleExpiresAt: NOW + 20 * 60 * 1000,
    ...overrides,
  };
}

describe("toSessionResponse", () => {
  it("répond une session nulle quand personne n'est connecté", () => {
    expect(toSessionResponse(null, FRANCECONNECT_ALIAS, NOW)).toEqual({ session: null });
  });

  it("expose la session sans jeton ni identifiant interne, avec la règle de son front et le temps restant", () => {
    const response = toSessionResponse(buildSession(), FRANCECONNECT_ALIAS, NOW);

    expect(response).toEqual({
      session: {
        sub: "sub",
        email: "camille.martin@exemple.fr",
        isFranceConnectSession: false,
        claims: { given_name: "Camille" },
        expiry: {
          idleTimeoutMs: 30 * 60 * 1000,
          maxDurationMs: 10 * 60 * 60 * 1000,
          idleRemainingMs: 20 * 60 * 1000,
          maxRemainingMs: 10 * 60 * 60 * 1000,
        },
      },
    });
  });

  it("reconnaît une session ouverte par FranceConnect", () => {
    const response = toSessionResponse(
      buildSession({ identityProvider: FRANCECONNECT_ALIAS }),
      FRANCECONNECT_ALIAS,
      NOW,
    );

    expect(response.session?.isFranceConnectSession).toBe(true);
  });

  it("donne la règle du front sur lequel la session a été ouverte", () => {
    const response = toSessionResponse(
      buildSession({ front: FRONT.BACK_OFFICE }),
      FRANCECONNECT_ALIAS,
      NOW,
    );

    expect(response.session?.expiry).toMatchObject(SESSION_POLICY_BY_FRONT[FRONT.BACK_OFFICE]);
  });
});
