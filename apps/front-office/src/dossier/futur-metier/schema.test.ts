import { describe, expect, it } from "vitest";

import { findSectionFields, futurMetierSchema, METIER_VISE_ENTRY_MODE } from "./schema";

function findMessages(data: Record<string, unknown>, field: string): string[] {
  const issues = futurMetierSchema.safeParse(data).error?.issues ?? [];
  return issues.filter((issue) => issue.path[0] === field).map((issue) => issue.message);
}

const EMPTY_FORM = {
  metierViseEntryMode: METIER_VISE_ENTRY_MODE.SEARCH,
  metierVise: null,
  intituleMetierVise: "",
  codeRome: "",
};

const MANUAL_FORM = {
  ...EMPTY_FORM,
  metierViseEntryMode: METIER_VISE_ENTRY_MODE.MANUAL,
  intituleMetierVise: "Boulanger",
};

describe("futurMetierSchema", () => {
  it("signale le métier manquant en recherche, sans exiger l'intitulé saisi à la main", () => {
    const issues = futurMetierSchema.safeParse(EMPTY_FORM).error?.issues ?? [];

    expect(issues.map(({ path }) => path.join("."))).toEqual(["metierVise"]);
    expect(findMessages(EMPTY_FORM, "metierVise")).toEqual([
      "Veuillez choisir le métier que vous visez.",
    ]);
  });

  it("accepte le métier choisi dans le référentiel", () => {
    const result = futurMetierSchema.safeParse({
      ...EMPTY_FORM,
      metierVise: {
        code: "11573",
        libelle: "Boulanger / Boulangère",
        metierRome: { code: "D1102", libelle: "Boulangerie - viennoiserie" },
      },
    });
    expect(result.success).toBe(true);
  });

  it("exige l'intitulé en saisie manuelle, sans exiger le métier du référentiel", () => {
    const data = { ...MANUAL_FORM, intituleMetierVise: "  " };
    const issues = futurMetierSchema.safeParse(data).error?.issues ?? [];

    expect(issues.map(({ path }) => path.join("."))).toEqual(["intituleMetierVise"]);
    expect(findMessages(data, "intituleMetierVise")).toEqual([
      "Veuillez saisir le nom du métier que vous visez.",
    ]);
  });
});

describe("futurMetierSchema, code ROME", () => {
  it("accepte un code vide", () => {
    expect(futurMetierSchema.safeParse(MANUAL_FORM).success).toBe(true);
  });

  it("accepte une lettre suivie de quatre chiffres", () => {
    expect(futurMetierSchema.safeParse({ ...MANUAL_FORM, codeRome: "D1102" }).success).toBe(true);
  });

  it("refuse un code mal formé", () => {
    for (const codeRome of ["D110", "D11022", "1102D", "d1102"]) {
      expect(findMessages({ ...MANUAL_FORM, codeRome }, "codeRome")).toEqual([
        "Le code ROME comporte une lettre suivie de quatre chiffres, par exemple D1102.",
      ]);
    }
  });

  it("ne contrôle pas le code en recherche", () => {
    expect(findMessages({ ...EMPTY_FORM, codeRome: "D110" }, "codeRome")).toEqual([]);
  });
});

describe("findSectionFields", () => {
  it("exige le métier choisi en recherche", () => {
    expect(findSectionFields(METIER_VISE_ENTRY_MODE.SEARCH)).toEqual({
      "metier-vise": ["metierVise"],
    });
  });

  it("exige l'intitulé en saisie manuelle, pas le code ROME", () => {
    expect(findSectionFields(METIER_VISE_ENTRY_MODE.MANUAL)).toEqual({
      "metier-vise": ["intituleMetierVise"],
    });
  });
});
