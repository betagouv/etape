import { describe, expect, it } from "vitest";

import { EMPLOYEUR_ENTRY_MODE, situationProfessionnelleSchema } from "./schema";

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
});
