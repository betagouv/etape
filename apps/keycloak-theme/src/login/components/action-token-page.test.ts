import { describe, expect, it } from "vitest";

import { isActionTokenPage, isUsedActionLink } from "./action-token-page";

const ACTION_TOKEN_PATHNAME = "/realms/etape/login-actions/action-token";
const EXPIRED_ACTION = "Action expirée. Merci de continuer la connexion.";

describe("isActionTokenPage", () => {
  it("reconnaît la page ouverte par un lien d'e-mail", () => {
    expect(isActionTokenPage(ACTION_TOKEN_PATHNAME)).toBe(true);
  });

  it("écarte les formulaires où Keycloak renvoie le même message", () => {
    expect(isActionTokenPage("/realms/etape/login-actions/authenticate")).toBe(false);
    expect(isActionTokenPage("/realms/etape/login-actions/registration")).toBe(false);
    expect(isActionTokenPage("/realms/etape/login-actions/reset-credentials")).toBe(false);
  });
});

describe("isUsedActionLink", () => {
  it("voit un lien déjà utilisé : message d'action expirée sur la page d'un lien", () => {
    expect(
      isUsedActionLink({
        summary: EXPIRED_ACTION,
        pathname: ACTION_TOKEN_PATHNAME,
        expiredActionSummary: EXPIRED_ACTION,
      }),
    ).toBe(true);
  });

  it("n'en voit pas sur l'inscription, qui renvoie le même message", () => {
    expect(
      isUsedActionLink({
        summary: EXPIRED_ACTION,
        pathname: "/realms/etape/login-actions/registration",
        expiredActionSummary: EXPIRED_ACTION,
      }),
    ).toBe(false);
  });

  it("n'en voit pas pour une autre erreur sur la page d'un lien", () => {
    expect(
      isUsedActionLink({
        summary: "Une erreur inattendue s'est produite.",
        pathname: ACTION_TOKEN_PATHNAME,
        expiredActionSummary: EXPIRED_ACTION,
      }),
    ).toBe(false);
  });
});
