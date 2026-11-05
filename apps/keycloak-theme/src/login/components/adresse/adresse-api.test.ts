import { describe, expect, it } from "vitest";

import { parseAdresses, toSearchQuery } from "./adresse-api";

const feature = (properties: Record<string, string>) => ({ properties });
const PARIS = { postcode: "75002", city: "Paris", citycode: "75102" };

describe("parseAdresses", () => {
  it("garde une adresse avec numéro", () => {
    const payload = {
      features: [feature({ ...PARIS, type: "housenumber", name: "12 rue de la Paix" })],
    };

    expect(parseAdresses(payload)).toEqual([
      {
        voie: "12 rue de la Paix",
        complement: "",
        codePostal: "75002",
        commune: "Paris",
        codeCommune: "75102",
      },
    ]);
  });

  it("garde une voie sans numéro", () => {
    const payload = { features: [feature({ ...PARIS, type: "street", name: "Rue de la Paix" })] };

    expect(parseAdresses(payload).map((adresse) => adresse.voie)).toEqual(["Rue de la Paix"]);
  });

  it("écarte une commune seule et une adresse incomplète", () => {
    const payload = {
      features: [
        feature({ ...PARIS, type: "municipality", name: "Paris" }),
        feature({ type: "street", name: "Rue sans commune" }),
      ],
    };

    expect(parseAdresses(payload)).toEqual([]);
  });

  it("refuse une réponse inattendue", () => {
    expect(() => parseAdresses({})).toThrow();
  });
});

describe("toSearchQuery", () => {
  it("retire ce que l'API refuse en tête de requête", () => {
    expect(toSearchQuery(" -rue victor hugo")).toBe("rue victor hugo");
    expect(toSearchQuery("«12 rue")).toBe("12 rue");
  });

  it("garde les lettres accentuées en tête", () => {
    expect(toSearchQuery("Étang de Berre")).toBe("Étang de Berre");
  });

  it("limite la longueur", () => {
    expect(toSearchQuery("a".repeat(250))).toHaveLength(200);
  });
});
