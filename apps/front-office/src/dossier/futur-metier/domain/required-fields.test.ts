import { describe, expect, it } from "vitest";

import { OUI_NON } from "../../domain/oui-non";
import { TYPE_DEMARCHE } from "./demarche";
import { FUTUR_METIER_SECTION, METIER_VISE_ENTRY_MODE, type FuturMetierFormData } from "../schema";
import { findRequiredFields } from "./required-fields";

/** Les perspectives d'emploi sont remplies, sans contact avec des employeurs. */
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
  precisionTypeDemarche: "",
  apportDemarche: "",
  piecesJustificatives: [],
  hasCurrentDemarche: true,
  currentDemarcheId: null,
  demarches: [],
  zoneRechercheEmploi: "Bordeaux et ses environs",
  demenagement: OUI_NON.NON,
  contactEmployeurs: OUI_NON.NON,
  entreprisesContactees: "",
};

/** Exigés quel que soit le mode de saisie : les trois zones de texte, puis la question sur les démarches. */
const COMMON_FIELDS = ["quotidienMetier", "conditionsEmploi", "debouches", "demarcheDecouverte"];

/** Exigés dans les perspectives d'emploi, sans contact avec des employeurs ; tous remplis dans `values`. */
const PERSPECTIVES_EMPLOI_FIELDS = ["zoneRechercheEmploi", "demenagement", "contactEmployeurs"];

/** La question sur les démarches est répondue dans `values`. */
const ANSWERED_FIELDS = ["demarcheDecouverte"];

describe("findRequiredFields", () => {
  it("exige le métier choisi en recherche, puis les trois zones de texte et la question sur les démarches", () => {
    const required = findRequiredFields(values);
    expect(required.sectionFields[FUTUR_METIER_SECTION.METIER_VISE]).toEqual([
      "metierVise",
      ...COMMON_FIELDS,
    ]);
    expect(required.allFields).toEqual([
      "metierVise",
      ...COMMON_FIELDS,
      ...PERSPECTIVES_EMPLOI_FIELDS,
    ]);
    expect(required.filledFields).toEqual([...ANSWERED_FIELDS, ...PERSPECTIVES_EMPLOI_FIELDS]);
    expect(required.sectionValidatedFields[FUTUR_METIER_SECTION.METIER_VISE]).toEqual([
      "metierVise",
      ...COMMON_FIELDS,
    ]);
  });

  it("n'exige ni ne contrôle la spécialisation, même remplie", () => {
    const required = findRequiredFields({ ...values, specialisation: "pâtisserie" });
    expect(required.allFields).not.toContain("specialisation");
    expect(required.filledFields).toEqual([...ANSWERED_FIELDS, ...PERSPECTIVES_EMPLOI_FIELDS]);
    expect(required.sectionValidatedFields[FUTUR_METIER_SECTION.METIER_VISE]).not.toContain(
      "specialisation",
    );
  });

  it("compte une zone de texte remplie", () => {
    const required = findRequiredFields({ ...values, debouches: "De nombreuses offres." });
    expect(required.filledFields).toEqual([
      "debouches",
      ...ANSWERED_FIELDS,
      ...PERSPECTIVES_EMPLOI_FIELDS,
    ]);
  });

  it("exige et contrôle le type et l'apport de la démarche après un « oui »", () => {
    const required = findRequiredFields({ ...values, demarcheDecouverte: OUI_NON.OUI });
    const expected = ["metierVise", ...COMMON_FIELDS, "typeDemarche", "apportDemarche"];
    expect(required.sectionFields[FUTUR_METIER_SECTION.METIER_VISE]).toEqual(expected);
    expect(required.sectionValidatedFields[FUTUR_METIER_SECTION.METIER_VISE]).toEqual(expected);
    expect(required.filledFields).toEqual([...ANSWERED_FIELDS, ...PERSPECTIVES_EMPLOI_FIELDS]);
  });

  it("n'exige plus rien de la démarche une fois sa carte de saisie fermée (maquette 12)", () => {
    const required = findRequiredFields({
      ...values,
      demarcheDecouverte: OUI_NON.OUI,
      hasCurrentDemarche: false,
    });
    expect(required.sectionFields[FUTUR_METIER_SECTION.METIER_VISE]).toEqual([
      "metierVise",
      ...COMMON_FIELDS,
    ]);
  });

  it("exige la précision pour « Autre », et compte les champs de la démarche remplis", () => {
    const required = findRequiredFields({
      ...values,
      demarcheDecouverte: OUI_NON.OUI,
      typeDemarche: TYPE_DEMARCHE.AUTRE,
      precisionTypeDemarche: "Stage chez un artisan",
    });
    expect(required.sectionFields[FUTUR_METIER_SECTION.METIER_VISE].slice(-3)).toEqual([
      "typeDemarche",
      "precisionTypeDemarche",
      "apportDemarche",
    ]);
    expect(required.filledFields).toEqual([
      ...ANSWERED_FIELDS,
      "typeDemarche",
      "precisionTypeDemarche",
      ...PERSPECTIVES_EMPLOI_FIELDS,
    ]);
  });

  it("exige l'intitulé saisi à la main, pas le code ROME", () => {
    const required = findRequiredFields({
      ...values,
      metierViseEntryMode: METIER_VISE_ENTRY_MODE.MANUAL,
      intituleMetierVise: "Boulanger",
      codeRome: "D1102",
    });
    expect(required.sectionFields[FUTUR_METIER_SECTION.METIER_VISE]).toEqual([
      "intituleMetierVise",
      ...COMMON_FIELDS,
    ]);
    expect(required.filledFields).toEqual([
      "intituleMetierVise",
      ...ANSWERED_FIELDS,
      ...PERSPECTIVES_EMPLOI_FIELDS,
    ]);
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

  it("exige les entreprises contactées après un « oui » aux contacts, à la fin de la page", () => {
    const required = findRequiredFields({ ...values, contactEmployeurs: OUI_NON.OUI });
    expect(required.allFields.at(-1)).toBe("entreprisesContactees");
    expect(required.filledFields).not.toContain("entreprisesContactees");

    const filled = findRequiredFields({
      ...values,
      contactEmployeurs: OUI_NON.OUI,
      entreprisesContactees: "Studio Okami",
    });
    expect(filled.filledFields.at(-1)).toBe("entreprisesContactees");
  });

  it("ne compte pas une zone de recherche d'emploi faite d'espaces", () => {
    const required = findRequiredFields({ ...values, zoneRechercheEmploi: "  " });
    expect(required.filledFields).not.toContain("zoneRechercheEmploi");
  });
});
