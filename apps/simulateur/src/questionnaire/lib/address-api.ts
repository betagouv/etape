import type { Commune } from "../domain/types";

// API Adresse / découpage administratif de l'État (aucune clé requise, CORS ouvert).
const ENDPOINT = "https://geo.api.gouv.fr/communes";

/**
 * Recherche des communes par nom via l'API publique de l'État.
 * Appel côté client (compatible export statique). Renvoie [] si la requête est
 * trop courte. Lève en cas d'échec réseau (à gérer par l'appelant).
 */
export async function searchCommunes(query: string, signal?: AbortSignal): Promise<Commune[]> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2) return [];

  const params = new URLSearchParams({
    nom: trimmedQuery,
    fields: "nom,code,codesPostaux,departement,region",
    boost: "population",
    limit: "7",
  });

  const res = await fetch(`${ENDPOINT}?${params.toString()}`, { signal });
  if (!res.ok) throw new Error(`geo.api.gouv.fr a répondu ${res.status}`);

  return (await res.json()) as Commune[];
}
