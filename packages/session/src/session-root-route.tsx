import {
  buildLoginUrl,
  checkStartupAccess,
  createLoginAttempts,
  createSessionQueryOptions,
  describeStartupNotice,
  STARTUP_PENDING_MESSAGE,
  useSessionExpired,
  type NoticeContent,
} from "@etape/api-client";
import { NoticeScreen } from "@etape/ui/components/notice-screen";
import { PendingScreen } from "@etape/ui/components/pending-screen";
import { SessionDialog } from "@etape/ui/components/session-dialog";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet, redirect } from "@tanstack/react-router";
import type { AxiosInstance } from "axios";

import { useAnnounce } from "./announcer";
import { AppErrorScreen, NotFoundScreen, toAnnouncement } from "./error-screens";
import { describeWarningDialog, SESSION_EXTENDED_MESSAGE } from "./session-dialogs";
import { useSessionActivity } from "./use-session-activity";

/** Compte les départs vers la connexion, pour ne pas boucler (voir `login-attempts.ts`). */
const loginAttempts = createLoginAttempts(() => window.sessionStorage);

/** Ce que chaque app fournit à son routeur. */
export interface SessionRouterContext {
  /** Lue par l'app dans son `.env`, que seul Vite sait lire. */
  apiBaseUrl: string;
  httpClient: AxiosInstance;
  queryClient: QueryClient;
}

/**
 * Route racine commune au front-office et au back-office : toute l'app est
 * derrière la connexion. Chaque app y accroche ses propres routes
 * (`sessionRootRoute.addChildren`).
 */
export const sessionRootRoute = createRootRouteWithContext<SessionRouterContext>()({
  // Garde de démarrage.
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.query(createSessionQueryOptions(context.httpClient));
    const access = checkStartupAccess(
      new URLSearchParams(location.searchStr),
      session,
      loginAttempts,
    );

    if (access.kind === "login-required") {
      // Navigation pleine page : le formulaire de connexion est servi par
      // Keycloak, via l'API, pas par cette app.
      throw redirect({
        href: buildLoginUrl(context.apiBaseUrl, location.href),
        reloadDocument: true,
      });
    }

    return { access };
  },
  component: SessionLayout,
  pendingComponent: StartupPendingScreen,
  // La garde a échoué (l'API ne répond pas) ou `SessionLayout` a planté :
  // c'est la personne qui relance, pas une boucle. Les erreurs des écrans,
  // elles, restent sous `SessionLayout` (`defaultErrorComponent` du routeur).
  errorComponent: AppErrorScreen,
  // Une adresse inconnue : rendu dans l'`Outlet` de `SessionLayout`.
  notFoundComponent: NotFoundScreen,
});

/** L'avis s'il y en a un ; sinon la prolongation, une fois faite ; sinon rien. */
function describeAnnouncement(notice: NoticeContent | null, isConfirmed: boolean): string {
  if (notice) return toAnnouncement(notice);
  return isConfirmed ? SESSION_EXTENDED_MESSAGE : "";
}

function StartupPendingScreen() {
  useAnnounce(STARTUP_PENDING_MESSAGE);

  return <PendingScreen message={STARTUP_PENDING_MESSAGE} />;
}

/**
 * Aiguille selon ce qu'a décidé la garde de démarrage (`beforeLoad`), puis
 * selon la session : avertissement avant sa fin, dialogue une fois finie.
 */
function SessionLayout() {
  const { access, apiBaseUrl, httpClient } = sessionRootRoute.useRouteContext();
  // Échec du parcours, ou cookie de session non conservé : un clic, jamais une
  // redirection automatique, sans quoi l'on bouclerait.
  const notice = describeStartupNotice(access);
  const expired = useSessionExpired(apiBaseUrl);
  // Derrière un avis, l'activité ne prolonge rien.
  const activity = useSessionActivity(httpClient, notice === null);
  useAnnounce(describeAnnouncement(notice, activity.isConfirmed));

  if (notice) {
    return (
      <NoticeScreen
        {...notice}
        onAction={() => window.location.assign(buildLoginUrl(apiBaseUrl, "/"))}
      />
    );
  }

  const warningDialog =
    activity.warning &&
    describeWarningDialog(activity.warning, {
      reconnectHref: expired.reconnectHref,
      confirmPresence: activity.confirmPresence,
      isConfirming: activity.isConfirming,
      hasConfirmFailed: activity.hasConfirmFailed,
    });

  return (
    <>
      {/*
        Session expirée : l'écran est retiré, pas seulement voilé. Vider le
        cache ne suffit pas, un écran monté garde les données qu'il affiche, et
        elles ne doivent pas rester lisibles sur un poste partagé.
      */}
      {!expired.isExpired && <Outlet />}
      {warningDialog && <SessionDialog open {...warningDialog} />}
      <SessionDialog
        open={expired.isExpired}
        {...expired.notice}
        action={{ href: expired.reconnectHref }}
      />
    </>
  );
}
