import { describe, expect, it } from "vitest";

import { findNationalites, splitSuggestion } from "./nationalites";

describe("findNationalites", () => {
  it("ignore les espaces autour de la recherche", () => {
    expect(findNationalites(" fra").map((n) => n.label)).toEqual(["Française"]);
    expect(findNationalites("fra ").map((n) => n.label)).toEqual(["Française"]);
  });

  it("ignore les accents et la casse", () => {
    expect(findNationalites("EQUATO").map((n) => n.label)).toEqual([
      "Équatoguinéenne",
      "Équatorienne",
    ]);
  });
});

describe("splitSuggestion", () => {
  it("met « Française » à part des autres nationalités", () => {
    const found = findNationalites("");
    const { suggestion, nationalites } = splitSuggestion(found);

    expect(suggestion?.label).toBe("Française");
    expect(nationalites).toHaveLength(found.length - 1);
    expect(nationalites.map((n) => n.label)).not.toContain("Française");
  });

  it("ne propose pas de suggestion quand la recherche ne la retient pas", () => {
    const found = findNationalites("EQUATO");

    expect(splitSuggestion(found)).toEqual({ suggestion: null, nationalites: found });
  });
});
