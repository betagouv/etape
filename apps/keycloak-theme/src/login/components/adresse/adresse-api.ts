import { type Adresse, type Commune, isAdresseComplete } from "./adresse";

const ADRESSE_SEARCH_URL = "https://data.geopf.fr/geocodage/search";
const COMMUNES_URL = "https://geo.api.gouv.fr/communes";
const REQUEST_TIMEOUT_MS = 5000;
const SUGGESTION_LIMIT = "5";
const MAX_QUERY_LENGTH = 200;
const LEADING_SYMBOLS = /^[^\p{L}\p{N}]+/u;

/** En dessous, l'API Adresse refuse la recherche. */
export const MIN_QUERY_LENGTH = 3;
const COMMUNE_TYPE = "municipality";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asString = (value: unknown): string => (typeof value === "string" ? value : "");

async function fetchJson(url: URL, signal: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  const abort = (): void => controller.abort();
  const timeout = setTimeout(abort, REQUEST_TIMEOUT_MS);
  signal.addEventListener("abort", abort);

  try {
    const response = await fetch(url, { signal: controller.signal, referrerPolicy: "no-referrer" });
    if (!response.ok) throw new Error(`Réponse ${response.status} de ${url.hostname}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
  }
}

/** Adresses complètes d'une réponse de l'API Adresse ; les communes seules sont écartées. */
export function parseAdresses(payload: unknown): Adresse[] {
  if (!isRecord(payload) || !Array.isArray(payload.features)) {
    throw new Error("Réponse inattendue de la recherche d'adresse");
  }

  return payload.features.flatMap((feature: unknown): Adresse[] => {
    const properties = isRecord(feature) ? feature.properties : undefined;
    if (!isRecord(properties) || properties.type === COMMUNE_TYPE) return [];

    const adresse: Adresse = {
      voie: asString(properties.name),
      complement: "",
      codePostal: asString(properties.postcode),
      commune: asString(properties.city),
      codeCommune: asString(properties.citycode),
    };

    return isAdresseComplete(adresse) ? [adresse] : [];
  });
}

/** Communes d'une réponse de `geo.api.gouv.fr`. */
export function parseCommunes(payload: unknown): Commune[] {
  if (!Array.isArray(payload)) throw new Error("Réponse inattendue de la liste des communes");

  return payload.flatMap((item: unknown): Commune[] => {
    if (!isRecord(item)) return [];
    const nom = asString(item.nom);
    const code = asString(item.code);
    return nom !== "" && code !== "" ? [{ nom, code }] : [];
  });
}

/** Texte saisi nettoyé pour l'API Adresse, qui refuse une requête ouverte par un symbole. */
export function toSearchQuery(text: string): string {
  return text.trim().replace(LEADING_SYMBOLS, "").slice(0, MAX_QUERY_LENGTH);
}

/** Suggestions d'adresse pour le texte saisi. */
export async function findAdresses(query: string, signal: AbortSignal): Promise<Adresse[]> {
  const q = toSearchQuery(query);
  if (q.length < MIN_QUERY_LENGTH) return [];

  const url = new URL(ADRESSE_SEARCH_URL);
  url.search = new URLSearchParams({
    q,
    autocomplete: "1",
    index: "address",
    limit: SUGGESTION_LIMIT,
  }).toString();

  return parseAdresses(await fetchJson(url, signal));
}

/** Communes couvertes par un code postal. */
export async function findCommunes(codePostal: string, signal: AbortSignal): Promise<Commune[]> {
  const url = new URL(COMMUNES_URL);
  url.search = new URLSearchParams({ codePostal, fields: "nom,code" }).toString();

  return parseCommunes(await fetchJson(url, signal));
}
