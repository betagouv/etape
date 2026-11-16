import { describe, expect, it } from "vitest";

import { formatCodeRome } from "./format-code-rome";

describe("formatCodeRome", () => {
  it("met la lettre en majuscule et retire les espaces", () => {
    expect(formatCodeRome("d1102")).toBe("D1102");
    expect(formatCodeRome(" d 1102 ")).toBe("D1102");
  });

  it("laisse un code vide ou déjà formé tel quel", () => {
    expect(formatCodeRome("")).toBe("");
    expect(formatCodeRome("D1102")).toBe("D1102");
  });
});
