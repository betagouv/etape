import { describe, expect, it } from "vitest";

import { OUI_NON } from "../../domain/oui-non";
import { FUTUR_METIER_SECTION, METIER_VISE_ENTRY_MODE, type FuturMetierFormData } from "../schema";
import { findRequiredFields } from "./required-fields";

const values: FuturMetierFormData = {
  metierViseEntryMode: METIER_VISE_ENTRY_MODE.SEARCH,
  metierVise: null,
  intituleMetierVise: "",
  codeRome: "",
  specialisation: "",
  quotidienMetier: "",
  conditionsEmploi: "",
  debouches: "",
  demarcheDecouverte: OUI_NON.NON,
};

/** Exigés quel que soit le mode de saisie : les trois zones de texte, puis la question sur les démarches. */
const COMMON_FIELDS = ["quotidienMetier", "conditionsEmploi", "debouches", "demarcheDecouverte"];

/** La question sur les démarches est répondue dans `values`. */
const ANSWERED_FIELDS = ["demarcheDecouverte"];

describe("findRequiredFields", () => {
  it("exige le métier choisi en recherche, puis les trois zones de texte et la question sur les démarches", () => {
    const required = findRequiredFields(values);
    expect(required.sectionFields[FUTUR_METIER_SECTION.METIER_VISE]).toEqual([
      "metierVise",
      ...COMMON_FIELDS,
    ]);
    expect(required.allFields).toEqual(["metierVise", ...COMMON_FIELDS]);
    expect(required.filledFields).toEqual(ANSWERED_FIELDS);
    expect(required.sectionValidatedFields[FUTUR_METIER_SECTION.METIER_VISE]).toEqual([
      "metierVise",
      ...COMMON_FIELDS,
    ]);
  });

  it("n'exige ni ne contrôle la spécialisation, même remplie", () => {
    const required = findRequiredFields({ ...values, specialisation: "pâtisserie" });
    expect(required.allFields).not.toContain("specialisation");
    expect(required.filledFields).toEqual(ANSWERED_FIELDS);
    expect(required.sectionValidatedFields[FUTUR_METIER_SECTION.METIER_VISE]).not.toContain(
      "specialisation",
    );
  });

  it("compte une zone de texte remplie", () => {
    const required = findRequiredFields({ ...values, debouches: "De nombreuses offres." });
    expect(required.filledFields).toEqual(["debouches", ...ANSWERED_FIELDS]);
  });

  it("exige l'intitulé saisi à la main, pas le code ROME", () => {
    const required = findRequiredFields({
      ...values,
      metierViseEntryMode: METIER_VISE_ENTRY_MODE.MANUAL,
      intituleMetierVise: "Boulanger",
      codeRome: "D1102",
    });
    expect(required.allFields).toEqual(["intituleMetierVise", ...COMMON_FIELDS]);
    expect(required.filledFields).toEqual(["intituleMetierVise", ...ANSWERED_FIELDS]);
  });

  it("contrôle le code ROME en saisie manuelle, entre l'intitulé et les zones de texte comme sur la page", () => {
    const required = findRequiredFields({
      ...values,
      metierViseEntryMode: METIER_VISE_ENTRY_MODE.MANUAL,
    });
    expect(required.sectionValidatedFields[FUTUR_METIER_SECTION.METIER_VISE]).toEqual([
      "intituleMetierVise",
      "codeRome",
      ...COMMON_FIELDS,
    ]);
  });
});
