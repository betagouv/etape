import { describe, expect, it } from "vitest";

import { ENTRY_MODE } from "../../domain/entry-mode";
import { OUI_NON } from "../../domain/oui-non";
import { TYPE_DEMARCHE } from "./type-demarche";
import {
  findSectionFields,
  findSectionValidatedFields,
  type SectionFieldsAnswers,
} from "./section-fields";

/** En recherche, sans réponse sur les démarches, carte de saisie ouverte : l'état de départ du volet. */
const ANSWERS: SectionFieldsAnswers = {
  metierViseEntryMode: ENTRY_MODE.SEARCH,
  hasCurrentDemarche: true,
};

const MANUAL_ANSWERS: SectionFieldsAnswers = {
  ...ANSWERS,
  metierViseEntryMode: ENTRY_MODE.MANUAL,
};

/** Les perspectives d'emploi, sans réponse sur les contacts avec des employeurs. */
const PERSPECTIVES_EMPLOI_FIELDS = ["zoneRechercheEmploi", "demenagement", "contactEmployeurs"];

describe("findSectionFields", () => {
  it("exige le métier choisi en recherche, puis les trois zones de texte et la question sur les démarches", () => {
    expect(findSectionFields(ANSWERS)).toEqual({
      "metier-vise": [
        "metierVise",
        "quotidienMetier",
        "conditionsEmploi",
        "debouches",
        "demarcheDecouverte",
      ],
      "perspectives-emploi": PERSPECTIVES_EMPLOI_FIELDS,
    });
  });

  it("exige l'intitulé en saisie manuelle, pas le code ROME ni la spécialisation", () => {
    expect(findSectionFields({ ...MANUAL_ANSWERS, demarcheDecouverte: OUI_NON.NON })).toEqual({
      "metier-vise": [
        "intituleMetierVise",
        "quotidienMetier",
        "conditionsEmploi",
        "debouches",
        "demarcheDecouverte",
      ],
      "perspectives-emploi": PERSPECTIVES_EMPLOI_FIELDS,
    });
  });

  it("ajoute les entreprises contactées après un « oui » aux contacts, pas après un « non »", () => {
    const oui = findSectionFields({ ...ANSWERS, contactEmployeurs: OUI_NON.OUI });
    const non = findSectionFields({ ...ANSWERS, contactEmployeurs: OUI_NON.NON });

    expect(oui["perspectives-emploi"]).toEqual([
      ...PERSPECTIVES_EMPLOI_FIELDS,
      "entreprisesContactees",
    ]);
    expect(non["perspectives-emploi"]).toEqual(PERSPECTIVES_EMPLOI_FIELDS);
  });

  it("garde les perspectives d'emploi hors de la section du métier", () => {
    const fields = findSectionFields({ ...ANSWERS, contactEmployeurs: OUI_NON.OUI });
    expect(fields["metier-vise"]).not.toContain("zoneRechercheEmploi");
    expect(fields["metier-vise"]).not.toContain("entreprisesContactees");
  });

  it("ajoute le type et l'apport de la démarche après un « oui » (maquette 10)", () => {
    const fields = findSectionFields({ ...ANSWERS, demarcheDecouverte: OUI_NON.OUI });
    expect(fields["metier-vise"].slice(-3)).toEqual([
      "demarcheDecouverte",
      "typeDemarche",
      "apportDemarche",
    ]);
  });

  it("ajoute la précision pour « Autre », entre le type et l'apport", () => {
    const fields = findSectionFields({
      ...ANSWERS,
      demarcheDecouverte: OUI_NON.OUI,
      typeDemarche: TYPE_DEMARCHE.AUTRE,
    });
    expect(fields["metier-vise"].slice(-3)).toEqual([
      "typeDemarche",
      "precisionTypeDemarche",
      "apportDemarche",
    ]);
  });

  it("ne demande rien de la démarche après un « non », même si un type reste saisi", () => {
    const fields = findSectionFields({
      ...ANSWERS,
      demarcheDecouverte: OUI_NON.NON,
      typeDemarche: TYPE_DEMARCHE.AUTRE,
    });
    expect(fields["metier-vise"].at(-1)).toBe("demarcheDecouverte");
  });

  it("ne demande rien de la démarche quand sa carte de saisie est fermée (maquette 12)", () => {
    const fields = findSectionFields({
      ...ANSWERS,
      demarcheDecouverte: OUI_NON.OUI,
      hasCurrentDemarche: false,
    });
    expect(fields["metier-vise"].at(-1)).toBe("demarcheDecouverte");
  });
});

describe("findSectionValidatedFields", () => {
  it("contrôle le code ROME en saisie manuelle, pas en recherche", () => {
    const manual = findSectionValidatedFields(MANUAL_ANSWERS);
    const search = findSectionValidatedFields(ANSWERS);

    expect(manual["metier-vise"].slice(0, 2)).toEqual(["intituleMetierVise", "codeRome"]);
    expect(search["metier-vise"]).not.toContain("codeRome");
  });

  it("contrôle les champs de la démarche après un « oui »", () => {
    const fields = findSectionValidatedFields({
      ...ANSWERS,
      demarcheDecouverte: OUI_NON.OUI,
      typeDemarche: TYPE_DEMARCHE.AUTRE,
    });
    expect(fields["metier-vise"].slice(-3)).toEqual([
      "typeDemarche",
      "precisionTypeDemarche",
      "apportDemarche",
    ]);
  });

  it("ne contrôle plus la démarche quand sa carte de saisie est fermée", () => {
    const fields = findSectionValidatedFields({
      ...ANSWERS,
      demarcheDecouverte: OUI_NON.OUI,
      hasCurrentDemarche: false,
    });
    expect(fields["metier-vise"]).not.toContain("typeDemarche");
  });

  it("contrôle les entreprises contactées après un « oui » aux contacts seulement", () => {
    const oui = findSectionValidatedFields({ ...ANSWERS, contactEmployeurs: OUI_NON.OUI });
    const non = findSectionValidatedFields({ ...ANSWERS, contactEmployeurs: OUI_NON.NON });

    expect(oui["perspectives-emploi"]).toContain("entreprisesContactees");
    expect(non["perspectives-emploi"]).not.toContain("entreprisesContactees");
  });
});
