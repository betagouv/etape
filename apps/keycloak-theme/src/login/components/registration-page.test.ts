// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { toRegistrationPageUrl } from "./registration-page";

describe("toRegistrationPageUrl", () => {
  it("retire l'étape et le code de session, garde le client et l'onglet", () => {
    const action =
      "http://localhost:8180/realms/etape/login-actions/registration?session_code=abc&execution=9f01&client_id=etape-api&tab_id=Dlj9&client_data=xyz";

    expect(toRegistrationPageUrl(action)).toBe(
      "http://localhost:8180/realms/etape/login-actions/registration?client_id=etape-api&tab_id=Dlj9&client_data=xyz",
    );
  });
});
