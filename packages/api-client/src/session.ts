import { getSession, type PublicSession } from "@etape/api-contract";
import type { AxiosInstance } from "axios";

/**
 * Une seule entrée du cache pour la session : la garde de démarrage la remplit,
 * `onUnauthorized` la vide, le dialogue « Session expirée » la lit.
 */
export const SESSION_QUERY_KEY = ["session"] as const;

const LOGIN_PATH = "/auth/login";

/**
 * `null` = personne n'est connecté, un état normal. La réponse est validée à la
 * frontière par le schéma du contrat, plutôt que supposée.
 */
export async function findSession(httpClient: AxiosInstance): Promise<PublicSession | null> {
  const response = await httpClient.get<unknown>(getSession.path);

  return getSession.response.parse(response.data).session;
}

/**
 * Adresse de la navigation pleine page vers le formulaire servi par Keycloak.
 * `returnTo` est un chemin interne, que l'API vérifie à son tour.
 */
export function buildLoginUrl(apiBaseUrl: string, returnTo: string): string {
  return `${apiBaseUrl}${LOGIN_PATH}?returnTo=${encodeURIComponent(returnTo)}`;
}
