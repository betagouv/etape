import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { SearchEtablissementsResponse } from "@etape/api-contract";

import type { Env } from "../config/env.js";
import {
  buildSireneSearchUrl,
  toSearchEtablissementsResponse,
  type SireneSearchResponse,
} from "./sirene.js";

const NO_ETABLISSEMENT: SearchEtablissementsResponse = {
  etablissementCount: 0,
  etablissements: [],
};

/** Recherche dans le répertoire Sirene de l'Insee, que seule l'API peut appeler avec sa clé. */
@Injectable()
export class EtablissementService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  async searchEtablissements(search: string): Promise<SearchEtablissementsResponse> {
    const url = buildSireneSearchUrl(this.config.get("API_SIRENE_URL", { infer: true }), search);
    if (!url) return NO_ETABLISSEMENT;

    const response = await fetch(url, {
      headers: { "X-INSEE-Api-Key-Integration": this.config.get("INSEE_API_KEY", { infer: true }) },
    });

    // Sirene répond 404 à une recherche sans résultat.
    if (response.status === HttpStatus.NOT_FOUND) return NO_ETABLISSEMENT;
    if (!response.ok) throw new Error(`Sirene a répondu ${response.status}`);

    return toSearchEtablissementsResponse((await response.json()) as SireneSearchResponse);
  }
}
