import { describe, expect, it } from "vitest";

import { OUI_NON } from "../domain/oui-non";
import { LONGUEUR_MAX_TEXTE } from "../domain/longueur-max-texte";
import { TYPE_DEMARCHE } from "./domain/type-demarche";
import { projetSchema } from "./schema";

function findMessages(data: Record<string, unknown>, field: string): string[] {
  const issues = projetSchema.safeParse(data).error?.issues ?? [];
  // Par le chemin entier : un champ de la démarche en cours est rangé sous `currentDemarche`.
  return issues.filter(({ path }) => path.join(".") === field).map((issue) => issue.message);
}

function findPaths(data: Record<string, unknown>): string[] {
  const issues = projetSchema.safeParse(data).error?.issues ?? [];
  return issues.map(({ path }) => path.join("."));
}

/** La démarche en cours de saisie, vide et sans type. */
const EMPTY_DEMARCHE = { precisionTypeDemarche: "", apportDemarche: "", piecesJustificatives: [] };

const EMPTY_FORM = {
  motivationChangement: "",
  effetsChangement: "",
  competencesAcquises: "",
  competencesAAcquerir: "",
  currentDemarche: EMPTY_DEMARCHE,
  hasCurrentDemarche: true,
  currentDemarcheId: null,
  demarches: [],
};

/** Tout est rempli, et la question sur les démarches a reçu un « non ». */
const FILLED_FORM = {
  ...EMPTY_FORM,
  motivationChangement: "Je veux un métier manuel, au contact des clients.",
  effetsChangement: "Des horaires décalés et un revenu plus faible la première année.",
  competencesAcquises: "La rigueur et l’organisation acquises en logistique.",
  competencesAAcquerir: "Les techniques de fabrication et les règles d’hygiène.",
  demarcheConstruction: OUI_NON.NON,
};

const TEXT_FIELDS = [
  "motivationChangement",
  "effetsChangement",
  "competencesAcquises",
  "competencesAAcquerir",
];

describe("projetSchema", () => {
  it("accepte un volet rempli", () => {
    expect(projetSchema.safeParse(FILLED_FORM).success).toBe(true);
  });

  it("exige les quatre zones de texte et la réponse sur les démarches", () => {
    expect(findPaths(EMPTY_FORM).sort()).toEqual([
      "competencesAAcquerir",
      "competencesAcquises",
      "demarcheConstruction",
      "effetsChangement",
      "motivationChangement",
    ]);
  });

  it("dit ce qui manque dans chaque zone de texte, espaces seuls refusés", () => {
    const blank = {
      ...FILLED_FORM,
      ...Object.fromEntries(TEXT_FIELDS.map((name) => [name, "  "])),
    };

    expect(findMessages(blank, "motivationChangement")).toEqual([
      "Veuillez indiquer pourquoi vous souhaitez changer de métier.",
    ]);
    expect(findMessages(blank, "effetsChangement")).toEqual([
      "Veuillez indiquer ce que ce changement va modifier dans votre situation.",
    ]);
    expect(findMessages(blank, "competencesAcquises")).toEqual([
      "Veuillez indiquer les compétences de votre parcours qui vous serviront dans votre futur métier.",
    ]);
    expect(findMessages(blank, "competencesAAcquerir")).toEqual([
      "Veuillez indiquer les compétences qu’il vous reste à acquérir.",
    ]);
  });

  it("accepte une zone de texte à la limite, espaces autour compris", () => {
    const atLimit = "x".repeat(LONGUEUR_MAX_TEXTE);
    for (const field of TEXT_FIELDS) {
      expect(findMessages({ ...FILLED_FORM, [field]: atLimit }, field)).toEqual([]);
      expect(findMessages({ ...FILLED_FORM, [field]: ` ${atLimit}\n` }, field)).toEqual([]);
    }
  });

  it("refuse une zone de texte qui dépasse la limite, même venue d'ailleurs que la saisie", () => {
    const overLimit = "x".repeat(LONGUEUR_MAX_TEXTE + 1);
    for (const field of TEXT_FIELDS) {
      expect(findMessages({ ...FILLED_FORM, [field]: overLimit }, field)).toEqual([
        "Votre texte ne doit pas dépasser 1000 caractères.",
      ]);
    }
  });
});

describe("projetSchema, démarches de construction du projet", () => {
  it("exige la réponse à la question sur les démarches", () => {
    expect(findMessages(EMPTY_FORM, "demarcheConstruction")).toEqual([
      "Veuillez indiquer si vous avez réalisé une démarche pour construire votre projet.",
    ]);
  });

  it("accepte « oui » comme « non »", () => {
    for (const demarcheConstruction of Object.values(OUI_NON)) {
      expect(findMessages({ ...EMPTY_FORM, demarcheConstruction }, "demarcheConstruction")).toEqual(
        [],
      );
    }
  });
});

describe("projetSchema, démarche en cours de saisie", () => {
  /** Le reste du volet est rempli : seules les erreurs de la démarche restent. */
  const OPEN_DEMARCHE_FORM = { ...FILLED_FORM, demarcheConstruction: OUI_NON.OUI };

  it("n'exige rien de la démarche en cours quand sa carte de saisie est fermée", () => {
    const data = { ...OPEN_DEMARCHE_FORM, hasCurrentDemarche: false };
    expect(projetSchema.safeParse(data).success).toBe(true);
  });

  it("garde les démarches validées telles quelles", () => {
    const demarche = {
      id: "a",
      typeDemarche: TYPE_DEMARCHE.BILAN_COMPETENCES,
      precisionTypeDemarche: "",
      apportDemarche: "J’ai identifié ce qui me motive.",
      piecesJustificatives: [],
    };
    const result = projetSchema.safeParse({
      ...OPEN_DEMARCHE_FORM,
      hasCurrentDemarche: false,
      demarches: [demarche],
    });
    expect(result.data?.demarches).toEqual([demarche]);
  });

  it("exige le type et l'apport après un « oui », pas la précision", () => {
    expect(findPaths(OPEN_DEMARCHE_FORM)).toEqual([
      "currentDemarche.typeDemarche",
      "currentDemarche.apportDemarche",
    ]);
    expect(findMessages(OPEN_DEMARCHE_FORM, "currentDemarche.typeDemarche")).toEqual([
      "Veuillez choisir le type de démarche.",
    ]);
    expect(findMessages(OPEN_DEMARCHE_FORM, "currentDemarche.apportDemarche")).toEqual([
      "Veuillez indiquer ce que la démarche vous a apporté.",
    ]);
  });

  it("exige la précision pour « Autre », espaces seuls refusés", () => {
    const data = {
      ...OPEN_DEMARCHE_FORM,
      currentDemarche: {
        ...EMPTY_DEMARCHE,
        typeDemarche: TYPE_DEMARCHE.AUTRE,
        precisionTypeDemarche: "  ",
        apportDemarche: "J’ai identifié ce qui me motive.",
      },
    };

    expect(findPaths(data)).toEqual(["currentDemarche.precisionTypeDemarche"]);
    expect(findMessages(data, "currentDemarche.precisionTypeDemarche")).toEqual([
      "Veuillez préciser le type de démarche.",
    ]);
  });

  it("accepte une démarche complète, sans précision pour un type de la liste", () => {
    const result = projetSchema.safeParse({
      ...OPEN_DEMARCHE_FORM,
      currentDemarche: {
        ...EMPTY_DEMARCHE,
        typeDemarche: TYPE_DEMARCHE.VAE,
        apportDemarche: "J’ai fait reconnaître mon expérience.",
      },
    });
    expect(result.success).toBe(true);
  });

  it("refuse un type absent de la liste, comme un type de « Mon futur métier »", () => {
    const data = {
      ...OPEN_DEMARCHE_FORM,
      currentDemarche: { ...EMPTY_DEMARCHE, typeDemarche: "salon" },
    };
    expect(findPaths(data)).toContain("currentDemarche.typeDemarche");
  });

  it("signale le type manquant au même envoi qu'un apport trop long", () => {
    const data = {
      ...OPEN_DEMARCHE_FORM,
      currentDemarche: { ...EMPTY_DEMARCHE, apportDemarche: "x".repeat(LONGUEUR_MAX_TEXTE + 1) },
    };
    expect(findPaths(data).sort()).toEqual([
      "currentDemarche.apportDemarche",
      "currentDemarche.typeDemarche",
    ]);
  });
});
