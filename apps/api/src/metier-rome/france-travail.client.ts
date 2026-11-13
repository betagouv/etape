import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { Env } from "../config/env.js";
import {
  buildMetiersRomeUrl,
  buildTokenRequestBody,
  buildVersionRomeUrl,
  metiersRomeResponseSchema,
  parseRetryAfterMs,
  tokenResponseSchema,
  toVersionRome,
  versionRomeResponseSchema,
} from "./france-travail.js";
import type { MetierRome, VersionRome } from "./metier-rome.types.js";

// Quota de 1 pour notre application : deux appels enchaînés reçoivent une 429, à 5 s d'écart ils passent.
const MIN_CALL_INTERVAL_MS = 5_000;

const REQUEST_TIMEOUT_MS = 30_000;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** API « ROME 4.0 – Métiers » de France Travail, que seule l'API peut appeler avec ses identifiants. */
@Injectable()
export class FranceTravailClient {
  private nextCallAt = 0;

  constructor(private readonly config: ConfigService<Env, true>) {}

  async fetchVersionRome(): Promise<VersionRome> {
    const url = buildVersionRomeUrl(this.config.get("API_ROME_METIERS_URL", { infer: true }));
    return toVersionRome(versionRomeResponseSchema.parse(await this.fetchJson(url)));
  }

  async fetchMetiersRome(): Promise<MetierRome[]> {
    const url = buildMetiersRomeUrl(this.config.get("API_ROME_METIERS_URL", { infer: true }));
    return metiersRomeResponseSchema.parse(await this.fetchJson(url));
  }

  private async fetchJson(url: URL): Promise<unknown> {
    const accessToken = await this.fetchAccessToken();
    let response = await this.call(url, accessToken);

    if (response.status === HttpStatus.TOO_MANY_REQUESTS) {
      const retryAt = Date.now() + parseRetryAfterMs(response.headers.get("Retry-After"));
      this.nextCallAt = Math.max(this.nextCallAt, retryAt);
      response = await this.call(url, accessToken);
    }

    if (!response.ok) throw new Error(`France Travail a répondu ${response.status}`);

    return response.json();
  }

  private async call(url: URL, accessToken: string): Promise<Response> {
    const delay = this.nextCallAt - Date.now();
    if (delay > 0) await wait(delay);

    try {
      return await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } finally {
      this.nextCallAt = Date.now() + MIN_CALL_INTERVAL_MS;
    }
  }

  private async fetchAccessToken(): Promise<string> {
    const response = await fetch(this.config.get("FRANCE_TRAVAIL_TOKEN_URL", { infer: true }), {
      method: "POST",
      body: buildTokenRequestBody(
        this.config.get("FRANCE_TRAVAIL_IO_ID", { infer: true }),
        this.config.get("FRANCE_TRAVAIL_IO_API_KEY", { infer: true }),
      ),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) throw new Error(`France Travail a refusé le jeton : ${response.status}`);

    return tokenResponseSchema.parse(await response.json()).access_token;
  }
}
