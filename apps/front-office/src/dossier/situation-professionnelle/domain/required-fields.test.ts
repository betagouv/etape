import { describe, expect, it } from "vitest";

import { ENTRY_MODE } from "../../domain/entry-mode";
import {
  DEMISSION,
  SITUATION_PROFESSIONNELLE_SECTION,
  type SituationProfessionnelleFormData,
} from "../schema";
import { findRequiredFields } from "./required-fields";

const values: SituationProfessionnelleFormData = {
  employeurEntryMode: ENTRY_MODE.SEARCH,
  employeur: null,
  denomination: "",
  siret: "",
  secteurActivite: "",
  adresse: "",
  intitulePoste: "Comptable",
  demission: DEMISSION.NON,
  dateDemission: "",
};

describe("findRequiredFields", () => {
  it("exige l'employeur choisi et le poste en recherche, la démission sans sa date après « non »", () => {
    const required = findRequiredFields(values);
    expect(required.sectionFields[SITUATION_PROFESSIONNELLE_SECTION.EMPLOI]).toEqual([
      "employeur",
      "intitulePoste",
    ]);
    expect(required.allFields).toEqual(["employeur", "intitulePoste", "demission"]);
    expect(required.filledFields).toEqual(["intitulePoste", "demission"]);
  });

  it("exige les quatre champs saisis à la main et la date après « oui »", () => {
    const required = findRequiredFields({
      ...values,
      employeurEntryMode: ENTRY_MODE.MANUAL,
      denomination: "ACME",
      demission: DEMISSION.OUI,
    });
    expect(required.allFields).toEqual([
      "denomination",
      "siret",
      "secteurActivite",
      "adresse",
      "intitulePoste",
      "demission",
      "dateDemission",
    ]);
    expect(required.filledFields).toEqual(["denomination", "intitulePoste", "demission"]);
  });

  it("ne contrôle que les champs exigés", () => {
    const required = findRequiredFields(values);

    expect(required.sectionValidatedFields).toEqual(required.sectionFields);
  });
});
