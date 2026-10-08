import { QueryClient } from "@tanstack/react-query";

import { isTransientApiError } from "./api-error";

const MAX_QUERY_RETRIES = 3;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Relancer une erreur qui n'est pas passagère ne ferait que retarder
        // son affichage — et, sur un 401, rappeler `onUnauthorized`.
        retry: (failureCount, error) =>
          isTransientApiError(error) && failureCount < MAX_QUERY_RETRIES,
      },
    },
  });
}
