import type { PublicSession } from "@etape/api-contract";
import { useQuery } from "@tanstack/react-query";

import { buildLoginUrl, SESSION_QUERY_KEY } from "./session";

export interface UseSessionExpiredResult {
  isExpired: boolean;
  reconnect: () => void;
}

/**
 * Lit la session dans le cache sans jamais la recharger : la garde de démarrage
 * la remplit, `onUnauthorized` la vide (`null`), ce qui ouvre le dialogue.
 */
export function useSessionExpired(apiBaseUrl: string): UseSessionExpiredResult {
  const { data: session } = useQuery<PublicSession | null>({
    queryKey: SESSION_QUERY_KEY,
    enabled: false,
  });

  return {
    isExpired: session === null,
    // Retour sur la page en cours après connexion.
    reconnect: () =>
      window.location.assign(
        buildLoginUrl(apiBaseUrl, `${window.location.pathname}${window.location.search}`),
      ),
  };
}
