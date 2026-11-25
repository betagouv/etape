import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { Env } from "../config/env.js";
import type { ImportedCertification } from "./certification.types.js";
import {
  buildExportResourcesUrl,
  exportResourcesResponseSchema,
  extractExportCsv,
  findLatestExportUrl,
  parseCertifications,
} from "./france-competences.js";

// Le zip pèse 10 Mo.
const REQUEST_TIMEOUT_MS = 60_000;

/** Export quotidien des répertoires RNCP et RS que France compétences publie sur data.gouv, sans clé. */
@Injectable()
export class FranceCompetencesClient {
  constructor(private readonly config: ConfigService<Env, true>) {}

  async fetchCertifications(): Promise<ImportedCertification[]> {
    const resourcesUrl = buildExportResourcesUrl(
      this.config.get("FRANCE_COMPETENCES_RESOURCES_URL", { infer: true }),
    );
    const resources = exportResourcesResponseSchema.parse(
      await (await this.get(resourcesUrl)).json(),
    );

    const zip = await (await this.get(findLatestExportUrl(resources))).arrayBuffer();
    const { standard, certificateurs } = extractExportCsv(new Uint8Array(zip));

    return parseCertifications(standard, certificateurs);
  }

  private async get(url: URL): Promise<Response> {
    const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`data.gouv a répondu ${response.status}`);

    return response;
  }
}
