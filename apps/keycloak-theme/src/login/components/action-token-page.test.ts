import { describe, expect, it } from "vitest";

import { isActionTokenPage } from "./action-token-page";

describe("isActionTokenPage", () => {
  it("reconnaît la page ouverte par un lien d'e-mail", () => {
    expect(isActionTokenPage("/realms/etape/login-actions/action-token")).toBe(true);
  });

  it("écarte les formulaires où Keycloak renvoie le même message", () => {
    expect(isActionTokenPage("/realms/etape/login-actions/authenticate")).toBe(false);
    expect(isActionTokenPage("/realms/etape/login-actions/registration")).toBe(false);
    expect(isActionTokenPage("/realms/etape/login-actions/reset-credentials")).toBe(false);
  });
});
