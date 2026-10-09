import type { PublicSession } from "@etape/api-contract";
import { hashKey, type QueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";

import { createHttpClient } from "./http-client";
import { createQueryClient } from "./query-client";
import { SESSION_END_QUERY_KEY, SESSION_QUERY_KEY } from "./session";
import { resolveSessionEndNotice, type SessionEndNotice } from "./session-timeline";

export interface SessionClients {
  httpClient: AxiosInstance;
  queryClient: QueryClient;
}

/**
 * Les deux clients d'une app, reliés : un 401 expire la session (voir
 * `expireSession`). Plusieurs 401 simultanés ne changent l'état qu'une fois.
 */
export function createSessionClients(apiBaseUrl: string): SessionClients {
  const queryClient = createQueryClient();
  const httpClient = createHttpClient(apiBaseUrl, {
    onUnauthorized: () => expireSession(queryClient),
  });

  return { httpClient, queryClient };
}

/**
 * Efface tout ce qui a été chargé pendant la session, requêtes et mutations :
 * sur un poste partagé, rien ne doit rester lisible derrière le dialogue.
 * Puis vide la session, ce qui ouvre le dialogue « Session expirée » ; à la
 * navigation suivante (bouton Précédent compris), la garde n'en trouve plus et
 * redirige vers le formulaire de connexion.
 *
 * Avant de la vider, relève pourquoi elle a pris fin, d'après les échéances
 * qu'elle annonçait : le dialogue le dira.
 *
 * Les requêtes de session sont gardées, vidées plutôt que supprimées : le
 * dialogue les observe, et un observateur ne suit pas une requête recréée.
 */
export function expireSession(queryClient: QueryClient): void {
  const keptQueryHashes = [hashKey(SESSION_QUERY_KEY), hashKey(SESSION_END_QUERY_KEY)];

  queryClient.setQueryData(SESSION_END_QUERY_KEY, findSessionEndNotice(queryClient));
  queryClient.removeQueries({ predicate: (query) => !keptQueryHashes.includes(query.queryHash) });
  queryClient.getMutationCache().clear();
  queryClient.setQueryData(SESSION_QUERY_KEY, null);
}

function findSessionEndNotice(queryClient: QueryClient): SessionEndNotice | null {
  const state = queryClient.getQueryState<PublicSession | null>(SESSION_QUERY_KEY);
  if (!state?.data) return null;

  return resolveSessionEndNotice(state.data.expiry, state.dataUpdatedAt, Date.now());
}
