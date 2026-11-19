import { describe, expect, it } from "vitest";

import { OUI_NON } from "../domain/oui-non";
import {
  findSectionFields,
  FUTUR_METIER_TEXT_MAX_LENGTH,
  futurMetierSchema,
  METIER_VISE_ENTRY_MODE,
} from "./schema";

function findMessages(data: Record<string, unknown>, field: string): string[] {
  const issues = futurMetierSchema.safeParse(data).error?.issues ?? [];
  return issues.filter((issue) => issue.path[0] === field).map((issue) => issue.message);
}

const EMPTY_FORM = {
  metierViseEntryMode: METIER_VISE_ENTRY_MODE.SEARCH,
  metierVise: null,
  intituleMetierVise: "",
  codeRome: "",
  specialisation: "",
  quotidienMetier: "",
  conditionsEmploi: "",
  debouches: "",
};

/** Les trois zones de texte remplies et la question sur les démarches répondue : il ne manque que le métier visé. */
const SEARCH_FORM = {
  ...EMPTY_FORM,
  quotidienMetier: "Pétrir, façonner et cuire le pain, tôt le matin.",
  conditionsEmploi: "Surtout des CDI, en boulangerie artisanale.",
  debouches: "De nombreuses offres non pourvues dans ma région.",
  demarcheDecouverte: OUI_NON.NON,
};

const MANUAL_FORM = {
  ...SEARCH_FORM,
  metierViseEntryMode: METIER_VISE_ENTRY_MODE.MANUAL,
  intituleMetierVise: "Boulanger",
};

describe("futurMetierSchema", () => {
  it("signale le métier manquant en recherche, sans exiger l'intitulé saisi à la main", () => {
    const issues = futurMetierSchema.safeParse(SEARCH_FORM).error?.issues ?? [];

    expect(issues.map(({ path }) => path.join("."))).toEqual(["metierVise"]);
    expect(findMessages(SEARCH_FORM, "metierVise")).toEqual([
      "Veuillez choisir le métier que vous visez.",
    ]);
  });

  it("accepte le métier choisi dans le référentiel", () => {
    const result = futurMetierSchema.safeParse({
      ...SEARCH_FORM,
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

describe("futurMetierSchema, zones de texte", () => {
  it("exige le quotidien, les conditions d'emploi et les débouchés", () => {
    expect(findMessages(EMPTY_FORM, "quotidienMetier")).toEqual([
      "Veuillez décrire le quotidien de ce métier.",
    ]);
    expect(findMessages(EMPTY_FORM, "conditionsEmploi")).toEqual([
      "Veuillez indiquer les conditions habituelles d’emploi dans le métier visé.",
    ]);
    expect(findMessages(EMPTY_FORM, "debouches")).toEqual([
      "Veuillez indiquer ce que vous savez des débouchés dans ce métier.",
    ]);
  });

  it("refuse une zone de texte faite d'espaces", () => {
    expect(findMessages({ ...SEARCH_FORM, quotidienMetier: " \n " }, "quotidienMetier")).toEqual([
      "Veuillez décrire le quotidien de ce métier.",
    ]);
  });

  it("signale le métier manquant au même envoi que les zones de texte vides et la question sans réponse", () => {
    const issues = futurMetierSchema.safeParse(EMPTY_FORM).error?.issues ?? [];

    expect(issues.map(({ path }) => path.join(".")).sort()).toEqual([
      "conditionsEmploi",
      "debouches",
      "demarcheDecouverte",
      "metierVise",
      "quotidienMetier",
    ]);
  });

  it("accepte une zone de texte à la limite, espaces autour compris", () => {
    const atLimit = "x".repeat(FUTUR_METIER_TEXT_MAX_LENGTH);
    expect(findMessages({ ...SEARCH_FORM, debouches: atLimit }, "debouches")).toEqual([]);
    expect(findMessages({ ...SEARCH_FORM, debouches: ` ${atLimit}\n` }, "debouches")).toEqual([]);
  });

  it("refuse une zone de texte qui dépasse la limite, même venue d'ailleurs que la saisie", () => {
    const overLimit = "x".repeat(FUTUR_METIER_TEXT_MAX_LENGTH + 1);
    for (const field of ["quotidienMetier", "conditionsEmploi", "debouches"]) {
      expect(findMessages({ ...SEARCH_FORM, [field]: overLimit }, field)).toEqual([
        "Votre texte ne doit pas dépasser 1000 caractères.",
      ]);
    }
  });

  it("n'exige pas la spécialisation", () => {
    expect(findMessages(EMPTY_FORM, "specialisation")).toEqual([]);
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
    for (const codeRome of ["D110", "D11022", "1102D", "D 11 0"]) {
      expect(findMessages({ ...MANUAL_FORM, codeRome }, "codeRome")).toEqual([
        "Le code ROME comporte une lettre suivie de quatre chiffres, par exemple D1102.",
      ]);
    }
  });

  it("accepte un code saisi en minuscule ou avec des espaces, et le rend mis en forme", () => {
    const result = futurMetierSchema.safeParse({ ...MANUAL_FORM, codeRome: " d 1102 " });
    expect(result.data?.codeRome).toBe("D1102");
  });

  it("ne contrôle pas le code en recherche", () => {
    expect(findMessages({ ...SEARCH_FORM, codeRome: "D110" }, "codeRome")).toEqual([]);
  });
});

describe("futurMetierSchema, démarches de découverte", () => {
  it("exige la réponse à la question sur les démarches", () => {
    expect(findMessages(EMPTY_FORM, "demarcheDecouverte")).toEqual([
      "Veuillez indiquer si vous avez entrepris des démarches pour découvrir ce métier.",
    ]);
  });

  it("accepte « oui » comme « non »", () => {
    for (const demarcheDecouverte of Object.values(OUI_NON)) {
      expect(findMessages({ ...EMPTY_FORM, demarcheDecouverte }, "demarcheDecouverte")).toEqual([]);
    }
  });
});

describe("findSectionFields", () => {
  it("exige le métier choisi en recherche, puis les trois zones de texte et la question sur les démarches", () => {
    expect(findSectionFields(METIER_VISE_ENTRY_MODE.SEARCH)).toEqual({
      "metier-vise": [
        "metierVise",
        "quotidienMetier",
        "conditionsEmploi",
        "debouches",
        "demarcheDecouverte",
      ],
    });
  });

  it("exige l'intitulé en saisie manuelle, pas le code ROME ni la spécialisation", () => {
    expect(findSectionFields(METIER_VISE_ENTRY_MODE.MANUAL)).toEqual({
      "metier-vise": [
        "intituleMetierVise",
        "quotidienMetier",
        "conditionsEmploi",
        "debouches",
        "demarcheDecouverte",
      ],
    });
  });
});
