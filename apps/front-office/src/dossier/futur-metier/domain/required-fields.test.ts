import { describe, expect, it } from "vitest";

import { ENTRY_MODE } from "../../domain/entry-mode";
import { FUTUR_METIER_SECTION, type FuturMetierFormData } from "../schema";
import { findRequiredFields } from "./required-fields";

const values: FuturMetierFormData = {
  metierViseEntryMode: ENTRY_MODE.SEARCH,
  metierVise: null,
  intituleMetierVise: "",
  codeRome: "",
};

describe("findRequiredFields", () => {
  it("exige le métier choisi en recherche", () => {
    const required = findRequiredFields(values);
    expect(required.sectionFields[FUTUR_METIER_SECTION.METIER_VISE]).toEqual(["metierVise"]);
    expect(required.allFields).toEqual(["metierVise"]);
    expect(required.filledFields).toEqual([]);
    expect(required.sectionValidatedFields[FUTUR_METIER_SECTION.METIER_VISE]).toEqual([
      "metierVise",
    ]);
  });

  it("exige l'intitulé saisi à la main, pas le code ROME", () => {
    const required = findRequiredFields({
      ...values,
      metierViseEntryMode: ENTRY_MODE.MANUAL,
      intituleMetierVise: "Boulanger",
      codeRome: "D1102",
    });
    expect(required.allFields).toEqual(["intituleMetierVise"]);
    expect(required.filledFields).toEqual(["intituleMetierVise"]);
  });

  it("contrôle le code ROME en saisie manuelle, après l'intitulé comme sur la page", () => {
    const required = findRequiredFields({
      ...values,
      metierViseEntryMode: ENTRY_MODE.MANUAL,
    });
    expect(required.sectionValidatedFields[FUTUR_METIER_SECTION.METIER_VISE]).toEqual([
      "intituleMetierVise",
      "codeRome",
    ]);
  });
});
