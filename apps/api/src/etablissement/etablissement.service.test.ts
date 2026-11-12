import { HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import type { Env } from "../config/env.js";
import { EtablissementService } from "./etablissement.service.js";
import {
  buildSireneSearchUrl,
  toSearchEtablissementsResponse,
  type SireneSearchResponse,
} from "./sirene.js";

const API_SIRENE_URL = "https://sirene.test/api";
const INSEE_API_KEY = "cle-de-test";

const NO_ETABLISSEMENT = { etablissementCount: 0, etablissements: [] };

const SIRENE_RESPONSE: SireneSearchResponse = {
  header: { total: 45451 },
  etablissements: [
    {
      siret: "50393256800010",
      uniteLegale: {
        denominationUniteLegale: "ACME",
        nomUniteLegale: null,
        prenomUsuelUniteLegale: null,
      },
      adresseEtablissement: {
        numeroVoieEtablissement: "1",
        typeVoieEtablissement: "RUE",
        libelleVoieEtablissement: "DE LA PAIX",
        codePostalEtablissement: "75002",
        libelleCommuneEtablissement: "PARIS",
      },
      periodesEtablissement: [
        { enseigne1Etablissement: null, activitePrincipaleEtablissement: "10.71C" },
      ],
    },
  ],
};

const fetchMock = vi.fn<typeof fetch>();

function createService(): EtablissementService {
  const values: Partial<Env> = { API_SIRENE_URL, INSEE_API_KEY };
  return new EtablissementService(new ConfigService<Env, true>(values));
}

describe("EtablissementService", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("ne contacte pas Sirene sans aucun mot à chercher", async () => {
    await expect(createService().searchEtablissements("!!!")).resolves.toEqual(NO_ETABLISSEMENT);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renvoie une liste vide quand Sirene répond 404", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: HttpStatus.NOT_FOUND }));

    await expect(createService().searchEtablissements("acme")).resolves.toEqual(NO_ETABLISSEMENT);
  });

  it("lève une exception quand Sirene répond une autre erreur", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: HttpStatus.INTERNAL_SERVER_ERROR }));

    await expect(createService().searchEtablissements("acme")).rejects.toThrow(
      "Sirene a répondu 500",
    );
  });

  it("lève une exception quand la réponse de Sirene n'a pas la forme attendue", async () => {
    fetchMock.mockResolvedValue(Response.json({ header: { total: 1 } }));

    await expect(createService().searchEtablissements("acme")).rejects.toThrow(ZodError);
  });

  it("renvoie les établissements trouvés, transformés pour le contrat", async () => {
    fetchMock.mockResolvedValue(Response.json(SIRENE_RESPONSE));

    await expect(createService().searchEtablissements("acme")).resolves.toEqual(
      toSearchEtablissementsResponse(SIRENE_RESPONSE),
    );
  });

  it("interroge Sirene avec la clé de l'API et un délai", async () => {
    fetchMock.mockResolvedValue(Response.json(SIRENE_RESPONSE));

    await createService().searchEtablissements("acme");

    const [url, init] = fetchMock.mock.lastCall ?? [];
    expect(String(url)).toBe(String(buildSireneSearchUrl(API_SIRENE_URL, "acme")));
    expect(init?.headers).toEqual({ "X-INSEE-Api-Key-Integration": INSEE_API_KEY });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });
});
