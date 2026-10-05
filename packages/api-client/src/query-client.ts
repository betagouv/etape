import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "./api-error";
import { HTTP_STATUS } from "./http-status";

const MAX_QUERY_RETRIES = 3;

function isClientError(error: Error): boolean {
  return (
    error instanceof ApiError &&
    error.status !== undefined &&
    // 500 est le premier statut 5xx : à partir de là, l'erreur vient du
    // serveur et peut être passagère.
    error.status < HTTP_STATUS.INTERNAL_SERVER_ERROR
  );
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Une 4xx ne se corrige pas en réessayant : la relancer ne fait que
        // retarder l'affichage de l'erreur — et, sur un 401, rappeler
        // `onUnauthorized`. Une erreur réseau, sans statut, reste relancée.
        retry: (failureCount, error) => !isClientError(error) && failureCount < MAX_QUERY_RETRIES,
      },
    },
  });
}
