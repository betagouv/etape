import { z } from "zod";

import { CLASSIFICATION_APPELLATION_ROME, type VersionRome } from "./metier-rome.types.js";

const TOKEN_SCOPE = "api_rome-metiersv1 nomenclatureRome";

// Sans `champs`, la liste ne rend que `code` et `libelle`.
const ROME_FIELDS = "code,libelle,appellations(code,libelle,libellecourt,classification)";

const MS_PER_SECOND = 1_000;

export const tokenResponseSchema = z.object({ access_token: z.string().min(1) });

/** Réponse de `GET /metiers/version`. */
export const versionRomeResponseSchema = z.object({
  version: z.string().min(1),
  lastModifiedDate: z.iso.datetime({ offset: true }),
});

type VersionRomeResponse = z.infer<typeof versionRomeResponseSchema>;

const appellationRomeSchema = z.object({
  code: z.string().min(1),
  libelle: z.string().min(1),
  libelleCourt: z.string().min(1),
  classification: z.enum(CLASSIFICATION_APPELLATION_ROME),
});

/** Réponse de `GET /metiers/metier` restreinte à `ROME_FIELDS` : tout le référentiel, sans pagination. */
export const metiersRomeResponseSchema = z.array(
  z.object({
    code: z.string().min(1),
    libelle: z.string().min(1),
    appellations: z.array(appellationRomeSchema),
  }),
);

export function buildTokenRequestBody(clientId: string, clientSecret: string): URLSearchParams {
  return new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: TOKEN_SCOPE,
  });
}

export function buildVersionRomeUrl(baseUrl: string): URL {
  return new URL(`${baseUrl}/metiers/version`);
}

/** Métiers et appellations en un seul appel. */
export function buildMetiersRomeUrl(baseUrl: string): URL {
  const url = new URL(`${baseUrl}/metiers/metier`);
  url.searchParams.set("champs", ROME_FIELDS);
  return url;
}

export function toVersionRome(response: VersionRomeResponse): VersionRome {
  return {
    version: response.version,
    dateModification: new Date(response.lastModifiedDate),
  };
}

/** `Retry-After` en secondes ; `0` s'il est absent ou illisible. */
export function parseRetryAfterMs(retryAfter: string | null): number {
  const seconds = Number(retryAfter);
  return Number.isFinite(seconds) && seconds > 0 ? seconds * MS_PER_SECOND : 0;
}
