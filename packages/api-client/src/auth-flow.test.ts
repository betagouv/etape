import { describe, expect, it } from "vitest";

import { AUTH_FLOW_ERROR, AUTH_FLOW_STEP, readAuthFlowFailure } from "./auth-flow";

describe("readAuthFlowFailure", () => {
  it("lit un échec de connexion", () => {
    expect(readAuthFlowFailure(new URLSearchParams("login=unavailable"))).toEqual({
      step: AUTH_FLOW_STEP.LOGIN,
      error: AUTH_FLOW_ERROR.UNAVAILABLE,
    });
  });

  it("lit un échec de déconnexion", () => {
    expect(readAuthFlowFailure(new URLSearchParams("logout=failed"))).toEqual({
      step: AUTH_FLOW_STEP.LOGOUT,
      error: AUTH_FLOW_ERROR.FAILED,
    });
  });

  it("ignore une valeur inconnue", () => {
    expect(readAuthFlowFailure(new URLSearchParams("login=pirate"))).toBeNull();
  });

  it("ne voit rien dans une adresse ordinaire", () => {
    expect(readAuthFlowFailure(new URLSearchParams("onglet=pieces"))).toBeNull();
  });
});
