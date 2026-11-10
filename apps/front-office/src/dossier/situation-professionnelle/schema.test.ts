import { describe, expect, it } from "vitest";

import {
  DEMISSION,
  EMPLOYEUR_ENTRY_MODE,
  findSectionFields,
  situationProfessionnelleSchema,
} from "./schema";

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
