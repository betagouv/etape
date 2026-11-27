import { HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { strToU8, zipSync } from "fflate";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Env } from "../config/env.js";
import { REPERTOIRE_CERTIFICATION, STATUT_CERTIFICATION } from "./certification.types.js";
import { FranceCompetencesClient } from "./france-competences.client.js";
import { buildExportResourcesUrl } from "./france-competences.js";

const FRANCE_COMPETENCES_RESOURCES_URL = "https://data.test/api/2/datasets/rncp/resources";
const EXPORT_URL = "https://static.data.test/export-fiches-csv-2026-11-24.zip";

const RESOURCES_RESPONSE = {
  data: [
    {
      title: "export-fiches-csv-2026-11-24.zip",
      url: EXPORT_URL,
      last_modified: "2026-11-24T02:00:09.694000+00:00",
    },
  ],
};

const EXPORT_ZIP = zipSync({
  "export_fiches_CSV_Standard_2026_11_23.csv": strToU8(
    '"Numero_Fiche";"Intitule";"Abrege_Libelle";"Nomenclature_Europe_Niveau";"Actif"\r\n' +
      '"RNCP42950";"CQP Boulanger";"";"NIV3";"ACTIVE"',
  ),
  "export_fiches_CSV_Certificateurs_2026_11_23.csv": strToU8(
    '"Numero_Fiche";"Siret_Certificateur";"Nom_Certificateur"\r\n' +
      '"RNCP42950";"\t78435466400029";"FEDERATION ENTREPRISES BOULANGERIE"',
  ),
});

const fetchMock = vi.fn<typeof fetch>();

function createClient(): FranceCompetencesClient {
  const values: Partial<Env> = { FRANCE_COMPETENCES_RESOURCES_URL };
  return new FranceCompetencesClient(new ConfigService<Env, true>(values));
}

describe("FranceCompetencesClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("télécharge le dernier export et en lit les fiches", async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json(RESOURCES_RESPONSE))
      .mockResolvedValueOnce(new Response(EXPORT_ZIP));

    await expect(createClient().fetchCertifications()).resolves.toEqual({
      fileName: "export-fiches-csv-2026-11-24.zip",
      certifications: [
        {
          numeroFiche: "RNCP42950",
          repertoire: REPERTOIRE_CERTIFICATION.RNCP,
          intitule: "CQP Boulanger",
          abrege: null,
          niveau: 3,
          statut: STATUT_CERTIFICATION.ACTIVE,
          certificateurs: [{ siret: "78435466400029", nom: "FEDERATION ENTREPRISES BOULANGERIE" }],
        },
      ],
    });

    const [[resourcesUrl, resourcesInit], [exportUrl]] = fetchMock.mock.calls;
    expect(String(resourcesUrl)).toBe(
      String(buildExportResourcesUrl(FRANCE_COMPETENCES_RESOURCES_URL)),
    );
    expect(resourcesInit?.signal).toBeInstanceOf(AbortSignal);
    expect(String(exportUrl)).toBe(EXPORT_URL);
  });

  it("ne télécharge rien quand la liste des ressources échoue", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: HttpStatus.SERVICE_UNAVAILABLE }));

    await expect(createClient().fetchCertifications()).rejects.toThrow("data.gouv a répondu 503");

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("signale un export introuvable", async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json(RESOURCES_RESPONSE))
      .mockResolvedValueOnce(new Response(null, { status: HttpStatus.NOT_FOUND }));

    await expect(createClient().fetchCertifications()).rejects.toThrow("data.gouv a répondu 404");
  });
});
