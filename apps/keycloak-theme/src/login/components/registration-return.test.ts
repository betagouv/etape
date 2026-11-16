import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  forgetRegistrationReturn,
  readRegistrationReturn,
  REGISTRATION_RETURN,
  rememberRegistrationReturn,
  shouldReturnToRegistration,
} from "./registration-return";

const FRANCECONNECT_CANCELLATION = {
  pathname: "/realms/etape/broker/franceconnect/endpoint",
  search: "?error=access_denied&state=abc",
};
const LOGIN = {
  pathname: "/realms/etape/login-actions/authenticate",
  search: "?client_id=etape-api",
};

const createStorage = (): Pick<Storage, "getItem" | "setItem" | "removeItem"> => {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
};

describe("registration-return", () => {
  beforeEach(() => {
    vi.stubGlobal("sessionStorage", createStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retient puis oublie la raison du retour", () => {
    rememberRegistrationReturn(REGISTRATION_RETURN.IDP_REVIEW_CANCELLED);
    expect(readRegistrationReturn()).toBe(REGISTRATION_RETURN.IDP_REVIEW_CANCELLED);

    forgetRegistrationReturn();
    expect(readRegistrationReturn()).toBeUndefined();
  });

  it("ignore une valeur inconnue et un stockage refusé", () => {
    sessionStorage.setItem("etape-registration-return", "autre");
    expect(readRegistrationReturn()).toBeUndefined();

    const refuse = () => {
      throw new Error("refusé");
    };
    vi.stubGlobal("sessionStorage", { getItem: refuse, setItem: refuse, removeItem: refuse });
    expect(() =>
      rememberRegistrationReturn(REGISTRATION_RETURN.FRANCECONNECT_CHOSEN),
    ).not.toThrow();
    expect(readRegistrationReturn()).toBeUndefined();
  });

  it("renvoie à l'inscription après « Revenir sur Transitions Pro » choisi depuis l'inscription", () => {
    expect(
      shouldReturnToRegistration(
        REGISTRATION_RETURN.FRANCECONNECT_CHOSEN,
        FRANCECONNECT_CANCELLATION,
      ),
    ).toBe(true);
  });

  it("laisse la connexion après une autre erreur ou sur la connexion ordinaire", () => {
    expect(
      shouldReturnToRegistration(REGISTRATION_RETURN.FRANCECONNECT_CHOSEN, {
        ...FRANCECONNECT_CANCELLATION,
        search: "?error=server_error",
      }),
    ).toBe(false);
    expect(shouldReturnToRegistration(REGISTRATION_RETURN.FRANCECONNECT_CHOSEN, LOGIN)).toBe(false);
    expect(
      shouldReturnToRegistration(REGISTRATION_RETURN.FRANCECONNECT_CHOSEN, {
        pathname: "/realms/etape/broker/proconnect/endpoint",
        search: "?error=access_denied",
      }),
    ).toBe(false);
  });

  it("laisse la connexion quand FranceConnect avait été choisi depuis la connexion", () => {
    expect(shouldReturnToRegistration(undefined, FRANCECONNECT_CANCELLATION)).toBe(false);
  });

  it("renvoie à l'inscription après « Annuler et revenir à l'inscription »", () => {
    expect(shouldReturnToRegistration(REGISTRATION_RETURN.IDP_REVIEW_CANCELLED, LOGIN)).toBe(true);
  });
});
