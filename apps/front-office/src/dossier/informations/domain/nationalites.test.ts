import { describe, expect, it } from "vitest";

import {
  findNationaliteAnnouncement,
  findNationaliteByCode,
  findNationalites,
  NATIONALITES,
  NO_NATIONALITE_MESSAGE,
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

describe("findNationaliteAnnouncement", () => {
  it("n'annonce rien tant que la liste est fermée", () => {
    expect(findNationaliteAnnouncement(false, "fra", 1)).toBe("");
  });

  it("n'annonce rien tant que rien n'est recherché : la liste entière s'affiche", () => {
    expect(findNationaliteAnnouncement(true, "", 195)).toBe("");
    expect(findNationaliteAnnouncement(true, "  ", 195)).toBe("");
  });

  it("annonce qu'aucune nationalité ne correspond", () => {
    expect(findNationaliteAnnouncement(true, "zzz", 0)).toBe(NO_NATIONALITE_MESSAGE);
  });

  it("annonce le nombre de nationalités affichées, au singulier comme au pluriel", () => {
    expect(findNationaliteAnnouncement(true, "fra", 1)).toBe("1 nationalité trouvée");
    expect(findNationaliteAnnouncement(true, "an", 12)).toBe("12 nationalités trouvées");
  });
});
