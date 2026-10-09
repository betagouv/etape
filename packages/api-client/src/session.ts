import { getSession, refreshSession, type PublicSession } from "@etape/api-contract";
import type { AxiosInstance } from "axios";

/**
 * Une seule entrée du cache pour la session : la garde de démarrage la remplit,
 * `onUnauthorized` la vide, le dialogue « Session expirée » la lit.
 */
export const SESSION_QUERY_KEY = ["session"] as const;

/**
 * Pourquoi la session a pris fin (`SessionEndNotice`), relevé au moment où elle
 * est vidée : le dialogue « Session expirée » le lit, alors que la session,
 * elle, n'est plus là pour le dire.
 */
export const SESSION_END_QUERY_KEY = ["session-end"] as const;

const LOGIN_PATH = "/auth/login";

/**
 * Délai des appels de session. Sans lui, une API qui ne répond pas laisserait
 * l'écran d'attente affiché indéfiniment. Court : la réponse est petite, et la
 * garde de démarrage le paie à chaque tentative (`session-query.ts`).
 */
export const SESSION_REQUEST_TIMEOUT_MS = 4_000;

/**
 * `null` = personne n'est connecté, un état normal. La réponse est validée à la
 * frontière par le schéma du contrat, plutôt que supposée.
 */
export async function findSession(httpClient: AxiosInstance): Promise<PublicSession | null> {
  const response = await httpClient.get<unknown>(getSession.path, {
    timeout: SESSION_REQUEST_TIMEOUT_MS,
  });

  return getSession.response.parse(response.data).session;
}

/**
 * Signale une activité et renvoie la session prolongée. Sans session, l'API
 * répond 401, et `onUnauthorized` ouvre le dialogue « Session expirée ».
 */
export async function recordSessionActivity(httpClient: AxiosInstance): Promise<PublicSession> {
  const response = await httpClient.post<unknown>(refreshSession.path, undefined, {
    timeout: SESSION_REQUEST_TIMEOUT_MS,
  });

  return refreshSession.response.parse(response.data).session;
}

/**
 * Adresse de la navigation pleine page vers le formulaire servi par Keycloak.
 * `returnTo` est un chemin interne, que l'API vérifie à son tour.
 */
export function buildLoginUrl(apiBaseUrl: string, returnTo: string): string {
  return `${apiBaseUrl}${LOGIN_PATH}?returnTo=${encodeURIComponent(returnTo)}`;
}
