import { describe, expect, it } from "vitest";

import {
  buildMetiersRomeUrl,
  buildTokenRequestBody,
  buildVersionRomeUrl,
  metiersRomeResponseSchema,
  parseRetryAfterMs,
  toVersionRome,
  versionRomeResponseSchema,
} from "./france-travail.js";

const BASE_URL = "https://api.francetravail.io/partenaire/rome-metiers/v1";

const APPELLATION = {
  code: "38444",
  libelle: "Boulanger-viennoisier / Boulangère-viennoisière",
  libelleCourt: "Boulanger-viennoisier / Boulangère-viennoisière",
  classification: "SYNONYME",
};

const METIER = { code: "D1102", libelle: "Boulanger / Boulangère", appellations: [APPELLATION] };

describe("buildTokenRequestBody", () => {
  it("demande un jeton d'application pour l'API ROME 4.0 – Métiers", () => {
    expect(Object.fromEntries(buildTokenRequestBody("identifiant", "cle"))).toEqual({
      grant_type: "client_credentials",
      client_id: "identifiant",
      client_secret: "cle",
      scope: "api_rome-metiersv1 nomenclatureRome",
    });
  });
});

describe("buildVersionRomeUrl", () => {
  it("vise la version courante du ROME", () => {
    expect(String(buildVersionRomeUrl(BASE_URL))).toBe(`${BASE_URL}/metiers/version`);
  });
});

describe("buildMetiersRomeUrl", () => {
  it("demande les métiers et leurs appellations en un appel", () => {
    const url = buildMetiersRomeUrl(BASE_URL);

    expect(url.origin + url.pathname).toBe(`${BASE_URL}/metiers/metier`);
    expect(url.searchParams.get("champs")).toBe(
      "code,libelle,appellations(code,libelle,libellecourt,classification)",
    );
  });
});

describe("versionRomeResponseSchema", () => {
  it("accepte la date de France Travail, à la microseconde", () => {
    const response = versionRomeResponseSchema.parse({
      version: "62",
      lastModifiedDate: "2026-10-16T16:55:33.170862Z",
    });

    expect(toVersionRome(response)).toEqual({
      version: "62",
      dateModification: new Date("2026-10-16T16:55:33.170Z"),
    });
  });

  it("refuse une date illisible", () => {
    expect(
      versionRomeResponseSchema.safeParse({ version: "62", lastModifiedDate: "hier" }).success,
    ).toBe(false);
  });
});

describe("metiersRomeResponseSchema", () => {
  it("garde les champs demandés et écarte les autres", () => {
    expect(metiersRomeResponseSchema.parse([{ ...METIER, obsolete: false }])).toEqual([METIER]);
  });

  it("refuse une classification inconnue", () => {
    const metier = { ...METIER, appellations: [{ ...APPELLATION, classification: "AUTRE" }] };

    expect(metiersRomeResponseSchema.safeParse([metier]).success).toBe(false);
  });

  it("refuse un métier sans appellations", () => {
    expect(
      metiersRomeResponseSchema.safeParse([{ code: "D1102", libelle: "Boulanger / Boulangère" }])
        .success,
    ).toBe(false);
  });
});

describe("parseRetryAfterMs", () => {
  it("lit un délai en secondes", () => {
    expect(parseRetryAfterMs("7")).toBe(7_000);
  });

  it.each([null, "", "bientôt", "-3"])("rend 0 pour « %s »", (retryAfter) => {
    expect(parseRetryAfterMs(retryAfter)).toBe(0);
  });
});
