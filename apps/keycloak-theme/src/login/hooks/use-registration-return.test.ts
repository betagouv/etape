// @vitest-environment jsdom
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  readRegistrationReturn,
  REGISTRATION_RETURN,
  rememberRegistrationReturn,
} from "../components/registration-return";
import { useRegistrationReturn } from "./use-registration-return";

const REGISTRATION_URL =
  "http://localhost/realms/etape/login-actions/registration?client_id=etape-api";
const CANCELLATION_PATH =
  "/realms/etape/broker/franceconnect/endpoint?error=access_denied&state=abc";
const LOGIN_PATH = "/realms/etape/login-actions/authenticate?client_id=etape-api";

const replace = vi.fn();

const visit = (path: string): void => {
  window.history.replaceState(null, "", path);
};

describe("useRegistrationReturn", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.spyOn(window, "location", "get").mockImplementation(() => {
      const current = new URL(document.URL);
      return { pathname: current.pathname, search: current.search, replace } as unknown as Location;
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    replace.mockReset();
    visit("/");
  });

  it("renvoie à l'inscription quand FranceConnect y avait été choisi", () => {
    visit(CANCELLATION_PATH);
    rememberRegistrationReturn(REGISTRATION_RETURN.FRANCECONNECT_CHOSEN);

    const { result } = renderHook(() => useRegistrationReturn(REGISTRATION_URL));

    expect(result.current).toBe(true);
    expect(replace).toHaveBeenCalledWith(REGISTRATION_URL);
    expect(readRegistrationReturn()).toBeUndefined();
  });

  it("renvoie à l'inscription après « Annuler »", () => {
    visit(LOGIN_PATH);
    rememberRegistrationReturn(REGISTRATION_RETURN.IDP_REVIEW_CANCELLED);

    const { result } = renderHook(() => useRegistrationReturn(REGISTRATION_URL));

    expect(result.current).toBe(true);
    expect(replace).toHaveBeenCalledWith(REGISTRATION_URL);
  });

  it("reste sur la connexion quand FranceConnect y avait été choisi", () => {
    visit(CANCELLATION_PATH);

    const { result } = renderHook(() => useRegistrationReturn(REGISTRATION_URL));

    expect(result.current).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });

  it("oublie un choix de FranceConnect abandonné sans quitter la connexion", () => {
    visit(LOGIN_PATH);
    rememberRegistrationReturn(REGISTRATION_RETURN.FRANCECONNECT_CHOSEN);

    const { result } = renderHook(() => useRegistrationReturn(REGISTRATION_URL));

    expect(result.current).toBe(false);
    expect(replace).not.toHaveBeenCalled();
    expect(readRegistrationReturn()).toBeUndefined();
  });

  it("reste sur la connexion quand l'inscription est fermée", () => {
    visit(LOGIN_PATH);
    rememberRegistrationReturn(REGISTRATION_RETURN.IDP_REVIEW_CANCELLED);

    const { result } = renderHook(() => useRegistrationReturn(undefined));

    expect(result.current).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });
});
