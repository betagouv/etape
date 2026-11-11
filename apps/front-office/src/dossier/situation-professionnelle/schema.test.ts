import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEMISSION,
  EMPLOYEUR_ENTRY_MODE,
  findSectionFields,
  situationProfessionnelleSchema,
} from "./schema";

function findDateDemissionMessages(data: Record<string, unknown>): string[] {
  const issues = situationProfessionnelleSchema.safeParse(data).error?.issues ?? [];
  return issues.filter((issue) => issue.path[0] === "dateDemission").map((issue) => issue.message);
}

const EMPTY_FORM = {
  employeurEntryMode: EMPLOYEUR_ENTRY_MODE.SEARCH,
  employeur: null,
  denomination: "",
  siret: "",
  secteurActivite: "",
  adresse: "",
  intitulePoste: "",
  demission: undefined,
  dateDemission: "",
};

describe("situationProfessionnelleSchema", () => {
  it("signale l'employeur manquant avec les autres erreurs, dès le premier envoi", () => {
    const issues = situationProfessionnelleSchema.safeParse(EMPTY_FORM).error?.issues ?? [];

    expect(issues.map(({ path }) => path.join("."))).toEqual([
      "intitulePoste",
      "demission",
      "employeur",
    ]);
  });

  it("demande la réponse sur la démission quand elle n'est pas choisie", () => {
    const issues = situationProfessionnelleSchema.safeParse(EMPTY_FORM).error?.issues ?? [];
    expect(
      issues.filter((issue) => issue.path[0] === "demission").map((issue) => issue.message),
    ).toEqual(["Veuillez indiquer si vous avez remis votre démission."]);
  });
});

describe("situationProfessionnelleSchema, date de démission", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date(2026, 10, 11, 15) });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("refuse une date à venir après un « oui »", () => {
    expect(
      findDateDemissionMessages({
        ...EMPTY_FORM,
        demission: DEMISSION.OUI,
        dateDemission: "12/11/2026",
      }),
    ).toEqual(["La date de votre démission ne peut pas être dans le futur."]);
  });

  it("accepte la date du jour", () => {
    expect(
      findDateDemissionMessages({
        ...EMPTY_FORM,
        demission: DEMISSION.OUI,
        dateDemission: "11/11/2026",
      }),
    ).toEqual([]);
  });

  it("ne contrôle pas la date après un « non »", () => {
    expect(
      findDateDemissionMessages({
        ...EMPTY_FORM,
        demission: DEMISSION.NON,
        dateDemission: "12/11/2026",
      }),
    ).toEqual([]);
  });
});

describe("findSectionFields", () => {
  it("exige l'employeur choisi et le poste en recherche", () => {
    expect(findSectionFields(EMPLOYEUR_ENTRY_MODE.SEARCH, undefined)).toEqual({
      emploi: ["employeur", "intitulePoste"],
      demission: ["demission"],
    });
  });

  it("exige les quatre champs de l'employeur, le poste et la date après un « oui »", () => {
    expect(findSectionFields(EMPLOYEUR_ENTRY_MODE.MANUAL, DEMISSION.OUI)).toEqual({
      emploi: ["denomination", "siret", "secteurActivite", "adresse", "intitulePoste"],
      demission: ["demission", "dateDemission"],
    });
  });
});
