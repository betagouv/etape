import type { PublicSession } from "@etape/api-contract";
import { useQuery } from "@tanstack/react-query";

import type { NoticeContent } from "./auth-flow-messages";
import { buildLoginUrl, SESSION_END_QUERY_KEY, SESSION_QUERY_KEY } from "./session";
import { describeSessionEnd } from "./session-messages";
import type { SessionEndNotice } from "./session-timeline";

export interface UseSessionExpiredResult {
  isExpired: boolean;
  /** Textes du dialogue, cause comprise quand elle est connue. */
  notice: NoticeContent;
  /** « Se reconnecter » : un lien, puisqu'il quitte l'app. */
  reconnectHref: string;
}

/**
 * Lit la session dans le cache sans jamais la recharger : la garde de démarrage
 * la remplit, `expireSession` la vide (`null`), ce qui ouvre le dialogue.
 */
export function useSessionExpired(apiBaseUrl: string): UseSessionExpiredResult {
  const { data: session } = useQuery<PublicSession | null>({
    queryKey: SESSION_QUERY_KEY,
    enabled: false,
  });
  const { data: endNotice = null } = useQuery<SessionEndNotice | null>({
    queryKey: SESSION_END_QUERY_KEY,
    enabled: false,
  });

  // Retour sur la page en cours après connexion, ancre comprise, comme le fait
  // la garde de démarrage. Lue au rendu : l'écran est retiré pendant que le
  // dialogue est ouvert, l'adresse ne bouge plus.
  const { pathname, search, hash } = window.location;

  return {
    isExpired: session === null,
    notice: describeSessionEnd(endNotice),
    reconnectHref: buildLoginUrl(apiBaseUrl, `${pathname}${search}${hash}`),
  };
}
