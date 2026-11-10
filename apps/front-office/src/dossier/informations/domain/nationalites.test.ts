import { describe, expect, it } from "vitest";

import {
  findNationaliteByCode,
  findNationalites,
  NATIONALITES,
  splitSuggestion,
} from "./nationalites";

describe("NATIONALITES", () => {
  it("n'a pas deux nationalités du même code : c'est la valeur enregistrée", () => {
    const codes = NATIONALITES.map((n) => n.code);

    expect(new Set(codes).size).toBe(codes.length);
  });
});

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

describe("findNationaliteByCode", () => {
  it("retrouve la nationalité du code enregistré", () => {
    expect(findNationaliteByCode("fr")?.label).toBe("Française");
  });

  it("ne trouve rien pour un code vide ou inconnu", () => {
    expect(findNationaliteByCode("")).toBeUndefined();
    expect(findNationaliteByCode("zz")).toBeUndefined();
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
