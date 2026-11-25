import { describe, expect, it } from "vitest";

import { toggleOptionValue } from "@etape/ui/lib/toggle-option";

const VALUE = { A: "a", B: "b", C: "c" } as const;

type Value = (typeof VALUE)[keyof typeof VALUE];

const OPTIONS: Record<Value, string> = {
  [VALUE.A]: "A",
  [VALUE.B]: "B",
  [VALUE.C]: "C",
};

describe("toggleOptionValue", () => {
  it("ajoute la valeur cochée à sa place dans l'ordre des options", () => {
    expect(toggleOptionValue(OPTIONS, [VALUE.C], VALUE.A, true)).toEqual([VALUE.A, VALUE.C]);
  });

  it("retire la valeur décochée", () => {
    expect(toggleOptionValue(OPTIONS, [VALUE.A, VALUE.B], VALUE.A, false)).toEqual([VALUE.B]);
  });

  it("ne double pas une valeur déjà cochée", () => {
    expect(toggleOptionValue(OPTIONS, [VALUE.B], VALUE.B, true)).toEqual([VALUE.B]);
  });
});
