import { describe, expect, it } from "vitest";

import { isOptionValue } from "@etape/ui/lib/option-value";

const CIVILITE_LABEL = {
  madame: "Madame",
  monsieur: "Monsieur",
} as const;

describe("isOptionValue", () => {
  it("reconnaît une valeur proposée", () => {
    expect(isOptionValue(CIVILITE_LABEL, "madame")).toBe(true);
  });

  it("refuse une valeur absente des options, dont la chaîne vide", () => {
    expect(isOptionValue(CIVILITE_LABEL, "autre")).toBe(false);
    expect(isOptionValue(CIVILITE_LABEL, "")).toBe(false);
  });

  it("refuse un libellé et une propriété héritée d'Object", () => {
    expect(isOptionValue(CIVILITE_LABEL, "Madame")).toBe(false);
    expect(isOptionValue(CIVILITE_LABEL, "toString")).toBe(false);
  });
});
