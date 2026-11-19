import { describe, expect, it } from "vitest";

import {
  DEMARCHE_FIELDS,
  findDemarcheFields,
  TYPE_DEMARCHE,
  TYPE_DEMARCHE_LABEL,
} from "./demarche";

describe("TYPE_DEMARCHE_LABEL", () => {
  it("propose neuf types, « Autre » en dernier", () => {
    const labels = Object.values(TYPE_DEMARCHE_LABEL);

    expect(labels).toHaveLength(9);
    expect(labels[0]).toBe("Immersion en entreprise (stage d’observation, PMSMP)");
    expect(labels.at(-1)).toBe("Autre");
  });
});

describe("findDemarcheFields", () => {
  it("exige le type et l'apport tant qu'aucun type n'est choisi", () => {
    expect(findDemarcheFields(undefined)).toEqual(["typeDemarche", "apportDemarche"]);
  });

  it("n'exige pas la précision pour un type de la liste", () => {
    expect(findDemarcheFields(TYPE_DEMARCHE.SALON)).toEqual(["typeDemarche", "apportDemarche"]);
  });

  it("exige la précision pour « Autre », entre le type et l'apport comme sur la page", () => {
    expect(findDemarcheFields(TYPE_DEMARCHE.AUTRE)).toEqual(DEMARCHE_FIELDS);
    expect(DEMARCHE_FIELDS).toEqual(["typeDemarche", "precisionTypeDemarche", "apportDemarche"]);
  });
});
