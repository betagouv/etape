// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { toReloadablePageUrl } from "./reloadable-page";

describe("toReloadablePageUrl", () => {
  it("retire l'étape et le code de session, garde le client et l'onglet", () => {
    const action =
      "http://localhost:8180/realms/etape/login-actions/registration?session_code=abc&execution=9f01&client_id=etape-api&tab_id=Dlj9&client_data=xyz";

    expect(toReloadablePageUrl(action)).toBe(
      "http://localhost:8180/realms/etape/login-actions/registration?client_id=etape-api&tab_id=Dlj9&client_data=xyz",
    );
  });

  it("vaut aussi pour « Finaliser la création de votre espace »", () => {
    const action =
      "http://localhost:8180/realms/etape/login-actions/first-broker-login?session_code=abc&execution=d2d2&client_id=etape-api&tab_id=Ll5M&client_data=xyz";

    expect(toReloadablePageUrl(action)).toBe(
      "http://localhost:8180/realms/etape/login-actions/first-broker-login?client_id=etape-api&tab_id=Ll5M&client_data=xyz",
    );
  });
});
