import { describe, expect, it } from "vitest";

import { AUTH_FLOW_ERROR, AUTH_FLOW_STEP } from "./auth-flow";
import { resolveStartupAccess } from "./startup-access";

const SESSION = {
  sub: "sub",
  isFranceConnectSession: false,
  claims: {},
};

describe("resolveStartupAccess", () => {
  it("laisse passer une personne connectée", () => {
    expect(resolveStartupAccess(new URLSearchParams(), SESSION)).toEqual({
      kind: "authenticated",
      session: SESSION,
    });
  });

  it("demande la connexion quand personne n'est connecté", () => {
    expect(resolveStartupAccess(new URLSearchParams(), null)).toEqual({ kind: "login-required" });
  });

  it("affiche l'échec du parcours sans rediriger, même sans session", () => {
    // Le cas qui évite la boucle : Keycloak en panne renvoie ici quelqu'un
    // qui n'est pas connecté, et une redirection repartirait vers la panne.
    expect(resolveStartupAccess(new URLSearchParams("login=unavailable"), null)).toEqual({
      kind: "auth-flow-failure",
      failure: { step: AUTH_FLOW_STEP.LOGIN, error: AUTH_FLOW_ERROR.UNAVAILABLE },
    });
  });

  it("laisse passer une personne connectée malgré un ancien échec de connexion", () => {
    // Favori, bouton Précédent ou autre onglet : la connexion a abouti depuis.
    expect(resolveStartupAccess(new URLSearchParams("login=expired"), SESSION)).toEqual({
      kind: "authenticated",
      session: SESSION,
    });
  });

  it("affiche l'échec d'une déconnexion même avec une session encore ouverte", () => {
    // Une déconnexion refusée par la limite de débit laisse la session ouverte.
    expect(resolveStartupAccess(new URLSearchParams("logout=too-many-requests"), SESSION)).toEqual({
      kind: "auth-flow-failure",
      failure: { step: AUTH_FLOW_STEP.LOGOUT, error: AUTH_FLOW_ERROR.TOO_MANY_REQUESTS },
    });
  });

  it("ignore un paramètre d'échec inconnu", () => {
    expect(resolveStartupAccess(new URLSearchParams("login=pirate"), null)).toEqual({
      kind: "login-required",
    });
  });
});
