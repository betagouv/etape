import { buildLoginUrl, describeAuthFlowFailure, useSessionExpired } from "@etape/api-client";
import { NoticeScreen } from "@etape/ui/components/notice-screen";
import { SessionExpiredDialog } from "@etape/ui/components/session-expired-dialog";
import { Outlet, rootRouteId, useRouteContext } from "@tanstack/react-router";

import { API_BASE_URL } from "../lib/clients";

/** Aiguille selon ce qu'a décidé la garde de démarrage (`beforeLoad`). */
export function RootLayout() {
  const { access } = useRouteContext({ from: rootRouteId });
  const { isExpired, reconnect } = useSessionExpired(API_BASE_URL);

  if (access.kind === "auth-flow-failure") {
    return (
      <NoticeScreen
        {...describeAuthFlowFailure(access.failure)}
        // Un clic, jamais une redirection automatique : si le service de
        // connexion reste en panne, on ne boucle pas.
        onAction={() => window.location.assign(buildLoginUrl(API_BASE_URL, "/"))}
      />
    );
  }

  return (
    <>
      {/*
        Session expirée : l'écran est retiré, pas seulement voilé. Vider le
        cache ne suffit pas, un écran monté garde les données qu'il affiche, et
        elles ne doivent pas rester lisibles sur un poste partagé.
      */}
      {!isExpired && <Outlet />}
      <SessionExpiredDialog open={isExpired} onReconnect={reconnect} />
    </>
  );
}
