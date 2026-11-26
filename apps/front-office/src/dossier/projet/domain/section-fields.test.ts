import { describe, expect, it } from "vitest";

import { OUI_NON } from "../../domain/oui-non";
import { findSectionFields, type SectionFieldsAnswers } from "./section-fields";
import { TYPE_DEMARCHE } from "./type-demarche";

/** Sans réponse sur les démarches, carte de saisie ouverte : l'état de départ du volet. */
const ANSWERS: SectionFieldsAnswers = { currentDemarche: {}, hasCurrentDemarche: true };

describe("findSectionFields", () => {
  it("exige deux zones de texte par section, puis la question sur les démarches (maquette 01)", () => {
    expect(findSectionFields(ANSWERS)).toEqual({
      projet: ["motivationChangement", "effetsChangement"],
      competences: ["competencesAcquises", "competencesAAcquerir"],
      demarches: ["demarcheConstruction"],
    });
  });

  it("ajoute le type et l'apport de la démarche après un « oui » (maquette 03)", () => {
    const fields = findSectionFields({ ...ANSWERS, demarcheConstruction: OUI_NON.OUI });
    expect(fields.demarches).toEqual([
      "demarcheConstruction",
      "currentDemarche.typeDemarche",
      "currentDemarche.apportDemarche",
    ]);
  });

  it("ajoute la précision pour « Autre », entre le type et l'apport (maquette 04)", () => {
    const fields = findSectionFields({
      ...ANSWERS,
      demarcheConstruction: OUI_NON.OUI,
      currentDemarche: { typeDemarche: TYPE_DEMARCHE.AUTRE },
    });
    expect(fields.demarches).toEqual([
      "demarcheConstruction",
      "currentDemarche.typeDemarche",
      "currentDemarche.precisionTypeDemarche",
      "currentDemarche.apportDemarche",
    ]);
  });

  it("ne demande rien de la démarche après un « non », même si un type reste saisi", () => {
    const fields = findSectionFields({
      ...ANSWERS,
      demarcheConstruction: OUI_NON.NON,
      currentDemarche: { typeDemarche: TYPE_DEMARCHE.AUTRE },
    });
    expect(fields.demarches).toEqual(["demarcheConstruction"]);
  });

  it("ne demande rien de la démarche quand sa carte de saisie est fermée", () => {
    const fields = findSectionFields({
      ...ANSWERS,
      demarcheConstruction: OUI_NON.OUI,
      hasCurrentDemarche: false,
    });
    expect(fields.demarches).toEqual(["demarcheConstruction"]);
  });

  it("garde les démarches hors des deux premières sections", () => {
    const fields = findSectionFields({ ...ANSWERS, demarcheConstruction: OUI_NON.OUI });
    expect(fields.projet).not.toContain("currentDemarche.typeDemarche");
    expect(fields.competences).not.toContain("currentDemarche.typeDemarche");
  });
});
