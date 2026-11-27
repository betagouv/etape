import { describe, expect, it } from "vitest";

import { findFieldsAfterOui, isOui, OUI_NON } from "./oui-non";

describe("isOui", () => {
  it("ne répond vrai qu'après un « oui »", () => {
    expect(isOui(OUI_NON.OUI)).toBe(true);
    expect(isOui(OUI_NON.NON)).toBe(false);
    expect(isOui(undefined)).toBe(false);
  });
});

describe("findFieldsAfterOui", () => {
  const FIELDS = ["dateDemission"];

  it("demande les champs après un « oui », aucun après un « non » ou sans réponse", () => {
    expect(findFieldsAfterOui(OUI_NON.OUI, FIELDS)).toEqual(FIELDS);
    expect(findFieldsAfterOui(OUI_NON.NON, FIELDS)).toEqual([]);
    expect(findFieldsAfterOui(undefined, FIELDS)).toEqual([]);
  });
});
