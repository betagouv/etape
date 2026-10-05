import type { QueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";

import { createHttpClient } from "./http-client";
import { createQueryClient } from "./query-client";
import { SESSION_QUERY_KEY } from "./session";

export interface SessionClients {
  httpClient: AxiosInstance;
  queryClient: QueryClient;
}

/**
 * Les deux clients d'une app, reliés : un 401 vide la session dans le cache, ce
 * qui ouvre le dialogue « Session expirée ». Plusieurs 401 simultanés ne
 * changent l'état qu'une fois.
 */
export function createSessionClients(apiBaseUrl: string): SessionClients {
  const queryClient = createQueryClient();
  const httpClient = createHttpClient(apiBaseUrl, {
    onUnauthorized: () => queryClient.setQueryData(SESSION_QUERY_KEY, null),
  });

  return { httpClient, queryClient };
}
