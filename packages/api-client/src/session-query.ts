import type { PublicSession } from "@etape/api-contract";
import { queryOptions, type DataTag, type UseQueryOptions } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";

import { isTransientApiError } from "./api-error";
import { findSession, SESSION_QUERY_KEY } from "./session";

/**
 * Deux relances, après 1 s puis 2 s : avec le délai de 4 s par tentative,
 * l'écran d'attente cède au plus après 15 s à « service indisponible ».
 */
const SESSION_READ_MAX_RETRIES = 2;

type SessionQueryKey = typeof SESSION_QUERY_KEY;

export type SessionQueryOptions = UseQueryOptions<
  PublicSession | null,
  Error,
  PublicSession | null,
  SessionQueryKey
> & { queryKey: DataTag<SessionQueryKey, PublicSession | null, Error> };

export function createSessionQueryOptions(httpClient: AxiosInstance): SessionQueryOptions {
  return queryOptions({
    queryKey: SESSION_QUERY_KEY,
    queryFn: () => findSession(httpClient),
    // Lue une fois, par la garde de démarrage : la fin de la session est
    // ensuite signalée par un 401, pas par une nouvelle lecture.
    staleTime: "static",
    // Par défaut, une requête se met en pause tant que le navigateur se croit
    // hors ligne (portail captif, certains VPN) : la garde attendrait sans fin,
    // et le délai des requêtes ne s'appliquerait jamais. Ici, elle part quand
    // même et finit sur l'écran d'erreur.
    networkMode: "always",
    retry: (failureCount, error) =>
      isTransientApiError(error) && failureCount < SESSION_READ_MAX_RETRIES,
  });
}
