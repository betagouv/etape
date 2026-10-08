import { describe, expect, it } from "vitest";

import { AUTH_FLOW_ERROR, AUTH_FLOW_STEP } from "./auth-flow";
import { LOGIN_LOOP_NOTICE } from "./app-notices";
import { createLoginAttempts, MAX_LOGIN_ATTEMPTS } from "./login-attempts";
import {
  checkStartupAccess,
  describeStartupNotice,
  resolveStartupAccess,
  type StartupAccess,
} from "./startup-access";
import { MemoryStorage } from "./testing/memory-storage";

const SESSION = {
  sub: "sub",
  isFranceConnectSession: false,
  claims: {},
};

describe("resolveStartupAccess", () => {
  it("laisse passer une personne connectée", () => {
    expect(resolveStartupAccess(new URLSearchParams(), SESSION, false)).toEqual({
      kind: "authenticated",
      session: SESSION,
    });
  });

  it("demande la connexion quand personne n'est connecté", () => {
    expect(resolveStartupAccess(new URLSearchParams(), null, false)).toEqual({
      kind: "login-required",
    });
  });

  it("affiche l'échec du parcours sans rediriger, même sans session", () => {
    // Le cas qui évite la boucle : Keycloak en panne renvoie ici quelqu'un
    // qui n'est pas connecté, et une redirection repartirait vers la panne.
    expect(resolveStartupAccess(new URLSearchParams("login=unavailable"), null, false)).toEqual({
      kind: "auth-flow-failure",
      failure: { step: AUTH_FLOW_STEP.LOGIN, error: AUTH_FLOW_ERROR.UNAVAILABLE },
    });
  });

  it("laisse passer une personne connectée malgré un ancien échec de connexion", () => {
    // Favori, bouton Précédent ou autre onglet : la connexion a abouti depuis.
    expect(resolveStartupAccess(new URLSearchParams("login=expired"), SESSION, false)).toEqual({
      kind: "authenticated",
      session: SESSION,
    });
  });

  it("affiche l'échec d'une déconnexion même avec une session encore ouverte", () => {
    // Une déconnexion refusée par la limite de débit laisse la session ouverte.
    expect(
      resolveStartupAccess(new URLSearchParams("logout=too-many-requests"), SESSION, false),
    ).toEqual({
      kind: "auth-flow-failure",
      failure: { step: AUTH_FLOW_STEP.LOGOUT, error: AUTH_FLOW_ERROR.TOO_MANY_REQUESTS },
    });
  });

  it("ignore un paramètre d'échec inconnu", () => {
    expect(resolveStartupAccess(new URLSearchParams("login=pirate"), null, false)).toEqual({
      kind: "login-required",
    });
  });

  it("renonce à rediriger quand une boucle est soupçonnée", () => {
    expect(resolveStartupAccess(new URLSearchParams(), null, true)).toEqual({
      kind: "login-loop",
    });
  });

  it("laisse passer une personne connectée malgré des tentatives récentes", () => {
    expect(resolveStartupAccess(new URLSearchParams(), SESSION, true)).toEqual({
      kind: "authenticated",
      session: SESSION,
    });
  });

  it("affiche l'échec du parcours avant le soupçon de boucle", () => {
    expect(resolveStartupAccess(new URLSearchParams("login=unavailable"), null, true).kind).toBe(
      "auth-flow-failure",
    );
  });
});

describe("checkStartupAccess", () => {
  /** Un démarrage de l'app, comme le fait la garde de chaque front. */
  function createStartup(): (session: typeof SESSION | null, search?: string) => StartupAccess {
    const storage = new MemoryStorage();
    const loginAttempts = createLoginAttempts(
      () => storage,
      () => 1_000_000,
    );

    return (session, search = "") =>
      checkStartupAccess(new URLSearchParams(search), session, loginAttempts);
  }

  it("cesse de rediriger quand on revient sans session après chaque départ", () => {
    // Le cookie de session n'est pas conservé : chaque retour de la connexion
    // se fait sans session.
    const start = createStartup();

    for (let attempt = 0; attempt < MAX_LOGIN_ATTEMPTS; attempt++) {
      expect(start(null).kind).toBe("login-required");
    }

    expect(start(null).kind).toBe("login-loop");
  });

  it("repart de zéro une fois connecté", () => {
    // Connexion, puis déconnexion : le départ suivant vers la connexion n'est
    // pas une boucle.
    const start = createStartup();

    expect(start(null).kind).toBe("login-required");
    expect(start(SESSION).kind).toBe("authenticated");

    for (let attempt = 0; attempt < MAX_LOGIN_ATTEMPTS; attempt++) {
      expect(start(null).kind).toBe("login-required");
    }
  });

  it("ne compte pas l'affichage d'un échec du parcours comme un départ", () => {
    // L'échec s'affiche sans redirection : c'est la personne qui relance.
    const start = createStartup();

    expect(start(null, "login=unavailable").kind).toBe("auth-flow-failure");
    expect(start(null, "login=unavailable").kind).toBe("auth-flow-failure");

    expect(start(null).kind).toBe("login-required");
  });
});

describe("describeStartupNotice", () => {
  it("donne l'avis de la boucle", () => {
    expect(describeStartupNotice({ kind: "login-loop" })).toBe(LOGIN_LOOP_NOTICE);
  });

  it("donne l'avis d'un échec du parcours", () => {
    expect(
      describeStartupNotice({
        kind: "auth-flow-failure",
        failure: { step: AUTH_FLOW_STEP.LOGIN, error: AUTH_FLOW_ERROR.EXPIRED },
      })?.title,
    ).toBe("La connexion n'a pas abouti");
  });

  it("n'en donne aucun quand l'app s'affiche", () => {
    expect(describeStartupNotice({ kind: "authenticated", session: SESSION })).toBeNull();
  });
});
