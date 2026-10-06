import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "./api-error";
import { HTTP_STATUS } from "./http-status";

const MAX_QUERY_RETRIES = 3;

/**
 * Seules une erreur réseau (sans statut, dont le dépassement du délai) et une
 * erreur serveur peuvent être passagères. Tout le reste ne se corrige pas en
 * réessayant : une 4xx, et une réponse hors contrat (`ZodError`), que relancer
 * ne ferait que retarder — et, sur un 401, rappeler `onUnauthorized`.
 */
function isRetryable(error: Error): boolean {
  return (
    error instanceof ApiError &&
    (error.status === undefined ||
      // 500 est le premier statut 5xx : à partir de là, l'erreur vient du
      // serveur.
      error.status >= HTTP_STATUS.INTERNAL_SERVER_ERROR)
  );
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => isRetryable(error) && failureCount < MAX_QUERY_RETRIES,
      },
    },
  });
}
