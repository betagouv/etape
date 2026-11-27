import { describe, expect, it } from "vitest";

import { ENTRY_MODE } from "../domain/entry-mode";
import { OUI_NON } from "../domain/oui-non";
import { TYPE_DEMARCHE } from "./domain/demarche";
import { FUTUR_METIER_TEXT_MAX_LENGTH, futurMetierSchema } from "./schema";

function findMessages(data: Record<string, unknown>, field: string): string[] {
  const issues = futurMetierSchema.safeParse(data).error?.issues ?? [];
  return issues.filter((issue) => issue.path[0] === field).map((issue) => issue.message);
}

const EMPTY_FORM = {
  metierViseEntryMode: ENTRY_MODE.SEARCH,
  metierVise: null,
  intituleMetierVise: "",
  codeRome: "",
  specialisation: "",
  quotidienMetier: "",
  conditionsEmploi: "",
  debouches: "",
  precisionTypeDemarche: "",
  apportDemarche: "",
  piecesJustificatives: [],
  hasCurrentDemarche: true,
  currentDemarcheId: null,
  demarches: [],
  zoneRechercheEmploi: "",
  entreprisesContactees: "",
};

/** Tout est rempli ou répondu, sauf le métier visé. */
const SEARCH_FORM = {
  ...EMPTY_FORM,
  quotidienMetier: "Pétrir, façonner et cuire le pain, tôt le matin.",
  conditionsEmploi: "Surtout des CDI, en boulangerie artisanale.",
  debouches: "De nombreuses offres non pourvues dans ma région.",
  demarcheDecouverte: OUI_NON.NON,
  zoneRechercheEmploi: "Bordeaux et ses environs",
  demenagement: OUI_NON.NON,
  contactEmployeurs: OUI_NON.NON,
};

const MANUAL_FORM = {
  ...SEARCH_FORM,
  metierViseEntryMode: ENTRY_MODE.MANUAL,
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

  it("signale le métier manquant au même envoi que les champs vides et les questions sans réponse", () => {
    const issues = futurMetierSchema.safeParse(EMPTY_FORM).error?.issues ?? [];

    expect(issues.map(({ path }) => path.join(".")).sort()).toEqual([
      "conditionsEmploi",
      "contactEmployeurs",
      "debouches",
      "demarcheDecouverte",
      "demenagement",
      "metierVise",
      "quotidienMetier",
      "zoneRechercheEmploi",
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

describe("futurMetierSchema, démarche en cours de saisie", () => {
  /** Le reste du volet est rempli : seules les erreurs de la démarche restent. */
  const OPEN_DEMARCHE_FORM = { ...MANUAL_FORM, demarcheDecouverte: OUI_NON.OUI };

  function findPaths(data: Record<string, unknown>): string[] {
    const issues = futurMetierSchema.safeParse(data).error?.issues ?? [];
    return issues.map(({ path }) => path.join("."));
  }

  it("n'exige rien de la démarche après un « non »", () => {
    expect(futurMetierSchema.safeParse(MANUAL_FORM).success).toBe(true);
  });

  it("n'exige rien de la démarche en cours quand sa carte de saisie est fermée", () => {
    const data = { ...OPEN_DEMARCHE_FORM, hasCurrentDemarche: false };
    expect(futurMetierSchema.safeParse(data).success).toBe(true);
  });

  it("garde les démarches validées telles quelles", () => {
    const demarche = {
      id: "a",
      typeDemarche: TYPE_DEMARCHE.SALON,
      precisionTypeDemarche: "",
      apportDemarche: "J’ai rencontré trois artisans.",
      piecesJustificatives: [],
    };
    const result = futurMetierSchema.safeParse({
      ...OPEN_DEMARCHE_FORM,
      hasCurrentDemarche: false,
      demarches: [demarche],
    });
    expect(result.data?.demarches).toEqual([demarche]);
  });

  it("exige le type et l'apport après un « oui », pas la précision", () => {
    expect(findPaths(OPEN_DEMARCHE_FORM)).toEqual(["typeDemarche", "apportDemarche"]);
    expect(findMessages(OPEN_DEMARCHE_FORM, "typeDemarche")).toEqual([
      "Veuillez choisir le type de démarche.",
    ]);
    expect(findMessages(OPEN_DEMARCHE_FORM, "apportDemarche")).toEqual([
      "Veuillez indiquer ce que la démarche vous a apporté.",
    ]);
  });

  it("exige la précision pour « Autre », espaces seuls refusés", () => {
    const data = {
      ...OPEN_DEMARCHE_FORM,
      typeDemarche: TYPE_DEMARCHE.AUTRE,
      precisionTypeDemarche: "  ",
      apportDemarche: "J’ai vérifié que je tenais ce rythme.",
    };

    expect(findPaths(data)).toEqual(["precisionTypeDemarche"]);
    expect(findMessages(data, "precisionTypeDemarche")).toEqual([
      "Veuillez préciser le type de démarche.",
    ]);
  });

  it("accepte une démarche complète, sans précision pour un type de la liste", () => {
    const result = futurMetierSchema.safeParse({
      ...OPEN_DEMARCHE_FORM,
      typeDemarche: TYPE_DEMARCHE.IMMERSION,
      apportDemarche: "J’ai vérifié que je tenais ce rythme.",
    });
    expect(result.success).toBe(true);
  });

  it("refuse un type absent de la liste", () => {
    expect(findPaths({ ...OPEN_DEMARCHE_FORM, typeDemarche: "stage" })).toContain("typeDemarche");
  });

  it("signale le type manquant au même envoi qu'un apport trop long", () => {
    const data = {
      ...OPEN_DEMARCHE_FORM,
      apportDemarche: "x".repeat(FUTUR_METIER_TEXT_MAX_LENGTH + 1),
    };
    expect(findPaths(data).sort()).toEqual(["apportDemarche", "typeDemarche"]);
  });

  it("refuse un apport au-delà de la limite", () => {
    const data = {
      ...OPEN_DEMARCHE_FORM,
      typeDemarche: TYPE_DEMARCHE.SALON,
      apportDemarche: "x".repeat(FUTUR_METIER_TEXT_MAX_LENGTH + 1),
    };
    expect(findMessages(data, "apportDemarche")).toEqual([
      `Votre texte ne doit pas dépasser ${FUTUR_METIER_TEXT_MAX_LENGTH} caractères.`,
    ]);
  });
});

describe("futurMetierSchema, perspectives d'emploi", () => {
  /** Le reste du volet est rempli : seules les erreurs des perspectives d'emploi restent. */
  const CONTACT_FORM = { ...MANUAL_FORM, contactEmployeurs: OUI_NON.OUI };

  it("exige la zone de recherche d'emploi, espaces seuls refusés", () => {
    for (const zoneRechercheEmploi of ["", "  "]) {
      expect(findMessages({ ...MANUAL_FORM, zoneRechercheEmploi }, "zoneRechercheEmploi")).toEqual([
        "Veuillez indiquer la zone où vous chercherez un emploi.",
      ]);
    }
  });

  it("ne limite pas la longueur de la zone de recherche d'emploi", () => {
    const zoneRechercheEmploi = "x".repeat(FUTUR_METIER_TEXT_MAX_LENGTH + 1);
    expect(futurMetierSchema.safeParse({ ...MANUAL_FORM, zoneRechercheEmploi }).success).toBe(true);
  });

  it("exige les réponses sur le déménagement et les contacts avec des employeurs", () => {
    expect(findMessages(EMPTY_FORM, "demenagement")).toEqual([
      "Veuillez indiquer si vous envisagez de déménager.",
    ]);
    expect(findMessages(EMPTY_FORM, "contactEmployeurs")).toEqual([
      "Veuillez indiquer si vous avez déjà des contacts avec des employeurs.",
    ]);
  });

  it("accepte « oui » comme « non » aux deux questions", () => {
    for (const answer of Object.values(OUI_NON)) {
      expect(findMessages({ ...EMPTY_FORM, demenagement: answer }, "demenagement")).toEqual([]);
      expect(
        findMessages({ ...EMPTY_FORM, contactEmployeurs: answer }, "contactEmployeurs"),
      ).toEqual([]);
    }
  });

  it("n'exige pas les entreprises contactées après un « non »", () => {
    expect(futurMetierSchema.safeParse(MANUAL_FORM).success).toBe(true);
  });

  it("exige les entreprises contactées après un « oui », espaces seuls refusés", () => {
    for (const entreprisesContactees of ["", " \n "]) {
      const data = { ...CONTACT_FORM, entreprisesContactees };
      expect(
        futurMetierSchema.safeParse(data).error?.issues.map(({ path }) => path.join(".")),
      ).toEqual(["entreprisesContactees"]);
      expect(findMessages(data, "entreprisesContactees")).toEqual([
        "Veuillez indiquer les entreprises contactées ou rencontrées.",
      ]);
    }
  });

  it("accepte les entreprises contactées remplies après un « oui »", () => {
    const data = { ...CONTACT_FORM, entreprisesContactees: "Studio Okami, rencontré au salon." };
    expect(futurMetierSchema.safeParse(data).success).toBe(true);
  });

  it("refuse des entreprises contactées au-delà de la limite", () => {
    const data = {
      ...CONTACT_FORM,
      entreprisesContactees: "x".repeat(FUTUR_METIER_TEXT_MAX_LENGTH + 1),
    };
    expect(findMessages(data, "entreprisesContactees")).toEqual([
      `Votre texte ne doit pas dépasser ${FUTUR_METIER_TEXT_MAX_LENGTH} caractères.`,
    ]);
  });

  it("signale le métier manquant au même envoi que des entreprises contactées trop longues", () => {
    const data = {
      ...SEARCH_FORM,
      contactEmployeurs: OUI_NON.OUI,
      entreprisesContactees: "x".repeat(FUTUR_METIER_TEXT_MAX_LENGTH + 1),
    };
    const issues = futurMetierSchema.safeParse(data).error?.issues ?? [];
    expect(issues.map(({ path }) => path.join(".")).sort()).toEqual([
      "entreprisesContactees",
      "metierVise",
    ]);
  });
});
