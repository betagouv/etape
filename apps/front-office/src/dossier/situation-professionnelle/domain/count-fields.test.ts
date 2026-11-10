import type { Etablissement } from "@etape/api-contract";
import { describe, expect, it } from "vitest";

import { countFilled, countInvalid, listFilledFields } from "./count-fields";

const employeur: Etablissement = {
  siret: "50393256800010",
  denomination: "ACME",
  enseigne: null,
  adresse: "1 rue de la Paix 75002 Paris",
  secteurActivite: "62.01Z",
};

describe("listFilledFields", () => {
  it("ne garde que les champs demandés qui ont une valeur", () => {
    expect(
      listFilledFields({ intitulePoste: "Comptable", dateDemission: "", siret: "503" }, [
        "intitulePoste",
        "dateDemission",
        "adresse",
      ]),
    ).toEqual(["intitulePoste"]);
  });

  it("compte l'employeur choisi comme rempli, pas l'absence d'employeur", () => {
    expect(listFilledFields({ employeur: null }, ["employeur"])).toEqual([]);
    expect(listFilledFields({ employeur }, ["employeur"])).toEqual(["employeur"]);
  });
});

describe("countFilled", () => {
  it("compte les champs demandés parmi les champs remplis", () => {
    expect(countFilled(["intitulePoste", "siret"], ["intitulePoste", "adresse"])).toBe(1);
  });
});

describe("countInvalid", () => {
  it("compte les erreurs des champs demandés", () => {
    expect(
      countInvalid({ siret: { message: "x" }, adresse: { message: "y" } }, [
        "siret",
        "intitulePoste",
      ]),
    ).toBe(1);
  });
});
