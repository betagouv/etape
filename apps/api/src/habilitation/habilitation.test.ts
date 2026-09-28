import { describe, expect, it } from "vitest";

import { hasRegionAccess } from "./habilitation.js";

describe("hasRegionAccess", () => {
  it("autorise un instructeur dont la région correspond", () => {
    const habilitations = [{ type: "instructeur", accountId: "a", regionId: "bretagne" } as const];

    expect(hasRegionAccess(habilitations, "bretagne")).toBe(true);
  });

  it("refuse un instructeur d'une autre région", () => {
    const habilitations = [{ type: "instructeur", accountId: "a", regionId: "bretagne" } as const];

    expect(hasRegionAccess(habilitations, "ile-de-france")).toBe(false);
  });

  it("refuse un superAdmin, qui n'a jamais accès aux dossiers", () => {
    const habilitations = [{ type: "superAdmin", accountId: "a" } as const];

    expect(hasRegionAccess(habilitations, "bretagne")).toBe(false);
  });

  it("autorise dès qu'une habilitation cumulée correspond", () => {
    const habilitations = [
      { type: "admin", accountId: "a", regionId: "ile-de-france" } as const,
      { type: "instructeur", accountId: "a", regionId: "bretagne" } as const,
    ];

    expect(hasRegionAccess(habilitations, "bretagne")).toBe(true);
  });

  it("refuse un compte sans habilitation", () => {
    expect(hasRegionAccess([], "bretagne")).toBe(false);
  });
});
