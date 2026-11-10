import { describe, expect, it } from "vitest";

import {
  buildManualAdresse,
  formatAdresse,
  isAdresseComplete,
  isCodePostalComplete,
} from "./adresse";
import { parseAdresses, parseCommunes } from "./adresse-api";

const FIELDS = {
  numeroVoie: " 15 ",
  typeVoie: "Rue",
  nomVoie: "Victor Hugo",
  complement: "",
  codePostal: "33124",
};

const AILLAS = { nom: "Aillas", code: "33002" };

const banFeature = (properties: Record<string, unknown>) => ({ properties });

describe("isAdresseComplete", () => {
  const COMPLETE = {
    voie: "15 Rue Victor Hugo",
    complement: "",
    codePostal: "33124",
    commune: "Aillas",
    codeCommune: "33002",
  };

  it("accepte une adresse sans complément", () => {
    expect(isAdresseComplete(COMPLETE)).toBe(true);
  });

  it.each(["voie", "codePostal", "commune", "codeCommune"] as const)(
    "refuse une adresse sans %s",
    (key) => {
      expect(isAdresseComplete({ ...COMPLETE, [key]: "" })).toBe(false);
    },
  );
});

describe("buildManualAdresse", () => {
  it("assemble la voie et reprend la commune choisie", () => {
    expect(buildManualAdresse(FIELDS, AILLAS)).toEqual({
      voie: "15 Rue Victor Hugo",
      complement: "",
      codePostal: "33124",
      commune: "Aillas",
      codeCommune: "33002",
    });
  });

  it("attend tous les champs obligatoires", () => {
    expect(buildManualAdresse({ ...FIELDS, typeVoie: "" }, AILLAS)).toBeNull();
    expect(buildManualAdresse({ ...FIELDS, nomVoie: "" }, AILLAS)).toBeNull();
    expect(buildManualAdresse({ ...FIELDS, codePostal: "331" }, AILLAS)).toBeNull();
    expect(buildManualAdresse(FIELDS, undefined)).toBeNull();
  });

  it("n'exige pas le numéro, un lieu-dit n'en a pas", () => {
    expect(buildManualAdresse({ ...FIELDS, numeroVoie: " " }, AILLAS)?.voie).toBe(
      "Rue Victor Hugo",
    );
  });

  it("n'exige pas le complément", () => {
    expect(buildManualAdresse({ ...FIELDS, complement: " Bât. B " }, AILLAS)?.complement).toBe(
      "Bât. B",
    );
  });
});

describe("formatAdresse", () => {
  it("affiche l'adresse sur une ligne, sans trou pour un complément vide", () => {
    expect(
      formatAdresse({
        voie: "9 Rue Victor Hugo",
        complement: "",
        codePostal: "33000",
        commune: "Bordeaux",
        codeCommune: "33063",
      }),
    ).toBe("9 Rue Victor Hugo 33000 Bordeaux");
  });
});

describe("isCodePostalComplete", () => {
  it.each([
    ["33124", true],
    ["3312", false],
    ["331245", false],
    ["2A000", false],
  ])("%s → %s", (codePostal, expected) => {
    expect(isCodePostalComplete(codePostal)).toBe(expected);
  });
});

describe("parseAdresses", () => {
  it("lit une adresse de la BAN", () => {
    expect(
      parseAdresses({
        features: [
          banFeature({
            type: "housenumber",
            name: "9 Rue Victor Hugo",
            postcode: "33000",
            city: "Bordeaux",
            citycode: "33063",
          }),
        ],
      }),
    ).toEqual([
      {
        voie: "9 Rue Victor Hugo",
        complement: "",
        codePostal: "33000",
        commune: "Bordeaux",
        codeCommune: "33063",
      },
    ]);
  });

  it("écarte les communes seules et les résultats incomplets", () => {
    expect(
      parseAdresses({
        features: [
          banFeature({
            type: "municipality",
            name: "Bordeaux",
            postcode: "33000",
            city: "Bordeaux",
            citycode: "33063",
          }),
          banFeature({ type: "street", name: "Rue sans commune" }),
          "inattendu",
        ],
      }),
    ).toEqual([]);
  });

  it("signale une réponse inattendue plutôt qu'une absence de résultat", () => {
    expect(() => parseAdresses({ message: "service indisponible" })).toThrow();
  });
});

describe("parseCommunes", () => {
  it("lit la liste des communes et écarte le reste", () => {
    expect(parseCommunes([AILLAS, { nom: "Sans code" }, null])).toEqual([AILLAS]);
  });

  it("signale une réponse inattendue", () => {
    expect(() => parseCommunes({ message: "erreur" })).toThrow();
  });
});
