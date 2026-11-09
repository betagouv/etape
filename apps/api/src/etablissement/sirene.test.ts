import { describe, expect, it } from "vitest";

import { buildSireneSearchUrl, toSearchEtablissementsResponse } from "./sirene.js";

const BASE_URL = "https://api.insee.fr/api-sirene/3.11";

const query = (search: string): string | null | undefined =>
  buildSireneSearchUrl(BASE_URL, search)?.searchParams.get("q");

describe("buildSireneSearchUrl", () => {
  it("cherche un SIRET, espaces compris", () => {
    expect(query("503 932 568 00010")).toBe(
      "siret:50393256800010 AND statutDiffusionEtablissement:O",
    );
  });

  it("cherche chaque mot en début de nom ou de commune", () => {
    expect(query("carrefour le cannet")).toBe(
      "(raisonSociale:carrefour* OR libelleCommuneEtablissement:carrefour*) AND " +
        "(raisonSociale:le* OR libelleCommuneEtablissement:le*) AND " +
        "(raisonSociale:cannet* OR libelleCommuneEtablissement:cannet*) AND " +
        "statutDiffusionEtablissement:O",
    );
  });

  it("envoie les mots sans accent, saisie composée (NFC) ou décomposée (NFD)", () => {
    expect(query("Cre\u0301teil")).toBe(query("Créteil"));
    expect(query("créteil")).toContain("raisonSociale:creteil*");
  });

  it("écarte la syntaxe de requête de Sirene", () => {
    expect(query('car:"*)')).toBe(
      "(raisonSociale:car* OR libelleCommuneEtablissement:car*) AND statutDiffusionEtablissement:O",
    );
  });

  it("ne cherche rien sans aucun mot", () => {
    expect(buildSireneSearchUrl(BASE_URL, "***")).toBeNull();
  });
});

describe("toSearchEtablissementsResponse", () => {
  const adresseEtablissement = {
    numeroVoieEtablissement: "93",
    typeVoieEtablissement: "AVENUE",
    libelleVoieEtablissement: "DE PARIS",
    codePostalEtablissement: "91300",
    libelleCommuneEtablissement: "MASSY",
  };

  it("reprend l'établissement et le libellé NAF de son activité", () => {
    const response = toSearchEtablissementsResponse({
      header: { total: 40 },
      etablissements: [
        {
          siret: "65201405100732",
          uniteLegale: {
            denominationUniteLegale: "CARREFOUR",
            nomUniteLegale: null,
            prenomUsuelUniteLegale: null,
          },
          adresseEtablissement,
          periodesEtablissement: [
            {
              enseigne1Etablissement: "ASSURANCES CARREFOUR - SERVICES FIN",
              activitePrincipaleEtablissement: "64.20Z",
            },
          ],
        },
      ],
    });

    expect(response).toEqual({
      etablissementCount: 40,
      etablissements: [
        {
          siret: "65201405100732",
          denomination: "CARREFOUR",
          enseigne: "ASSURANCES CARREFOUR - SERVICES FIN",
          adresse: "93 AVENUE DE PARIS 91300 MASSY",
          secteurActivite: "Activités des sociétés holding",
        },
      ],
    });
  });

  it("nomme une entreprise individuelle par la personne, sans libellé hors NAF rév. 2", () => {
    const [etablissement] = toSearchEtablissementsResponse({
      header: { total: 1 },
      etablissements: [
        {
          siret: "10895344900015",
          uniteLegale: {
            denominationUniteLegale: null,
            nomUniteLegale: "CABRION",
            prenomUsuelUniteLegale: "SEPHORA",
          },
          adresseEtablissement,
          periodesEtablissement: [
            { enseigne1Etablissement: null, activitePrincipaleEtablissement: "90.11" },
          ],
        },
      ],
    }).etablissements;

    expect(etablissement.denomination).toBe("SEPHORA CABRION");
    expect(etablissement.secteurActivite).toBeNull();
  });
});
