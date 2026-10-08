import { hashKey, type QueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";

import { createHttpClient } from "./http-client";
import { createQueryClient } from "./query-client";
import { SESSION_QUERY_KEY } from "./session";

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
 * La requête de session est gardée, vidée plutôt que supprimée : le dialogue
 * l'observe, et un observateur ne suit pas une requête recréée.
 */
function expireSession(queryClient: QueryClient): void {
  const sessionQueryHash = hashKey(SESSION_QUERY_KEY);

  queryClient.removeQueries({ predicate: (query) => query.queryHash !== sessionQueryHash });
  queryClient.getMutationCache().clear();
  queryClient.setQueryData(SESSION_QUERY_KEY, null);
}
