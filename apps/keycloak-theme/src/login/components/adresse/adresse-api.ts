import type { Adresse, Commune } from "./adresse";

const ADRESSE_SEARCH_URL = "https://data.geopf.fr/geocodage/search";
const COMMUNES_URL = "https://geo.api.gouv.fr/communes";
const REQUEST_TIMEOUT_MS = 5000;
const SUGGESTION_LIMIT = "5";
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
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Réponse ${response.status} de ${url.hostname}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
  }
}

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

    return adresse.voie !== "" &&
      adresse.codePostal !== "" &&
      adresse.commune !== "" &&
      adresse.codeCommune !== ""
      ? [adresse]
      : [];
  });
}

export function parseCommunes(payload: unknown): Commune[] {
  if (!Array.isArray(payload)) throw new Error("Réponse inattendue de la liste des communes");

  return payload.flatMap((item: unknown): Commune[] => {
    if (!isRecord(item)) return [];
    const nom = asString(item.nom);
    const code = asString(item.code);
    return nom !== "" && code !== "" ? [{ nom, code }] : [];
  });
}

export async function findAdresses(query: string, signal: AbortSignal): Promise<Adresse[]> {
  const url = new URL(ADRESSE_SEARCH_URL);
  url.search = new URLSearchParams({
    q: query,
    autocomplete: "1",
    index: "address",
    limit: SUGGESTION_LIMIT,
  }).toString();

  return parseAdresses(await fetchJson(url, signal));
}

export async function findCommunes(codePostal: string, signal: AbortSignal): Promise<Commune[]> {
  const url = new URL(COMMUNES_URL);
  url.search = new URLSearchParams({ codePostal, fields: "nom,code" }).toString();

  return parseCommunes(await fetchJson(url, signal));
}
