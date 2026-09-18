import { describe, expect, it } from "vitest";

import { getIdentityProvider, LOCAL_IDENTITY_PROVIDER } from "./identity-provider.js";

describe("getIdentityProvider", () => {
  it("reprend l'alias posé par le broker", () => {
    expect(getIdentityProvider({ identity_provider: "franceconnect" })).toBe("franceconnect");
  });

  it("vaut local sans broker", () => {
    expect(getIdentityProvider({})).toBe(LOCAL_IDENTITY_PROVIDER);
    expect(getIdentityProvider({ identity_provider: "" })).toBe(LOCAL_IDENTITY_PROVIDER);
  });
});
