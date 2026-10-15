import {
  buildLoginUrl,
  checkStartupAccess,
  createLoginAttempts,
  createSessionQueryOptions,
  STARTUP_PENDING_MESSAGE,
} from "@etape/api-client";
import { PendingScreen } from "@etape/ui/components/pending-screen";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, createRoute, redirect } from "@tanstack/react-router";
import type { AxiosInstance } from "axios";

import { App } from "../App";
import { API_BASE_URL } from "../lib/clients";
import { AppErrorScreen, HOME_PATH, NotFoundScreen } from "./error-screens";
import { RootLayout } from "./root-layout";

/** Compte les départs vers la connexion, pour ne pas boucler (voir `login-attempts.ts`). */
const loginAttempts = createLoginAttempts(() => window.sessionStorage);

export interface RouterContext {
  httpClient: AxiosInstance;
  queryClient: QueryClient;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  // Garde de démarrage : toute l'app est derrière la connexion.
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
      throw redirect({ href: buildLoginUrl(API_BASE_URL, location.href), reloadDocument: true });
    }

    return { access };
  },
  component: RootLayout,
  pendingComponent: () => <PendingScreen message={STARTUP_PENDING_MESSAGE} />,
  // La garde a échoué (l'API ne répond pas) ou `RootLayout` a planté : c'est
  // la personne qui relance, pas une boucle. Les erreurs des écrans, elles,
  // restent sous `RootLayout` (`defaultErrorComponent` du routeur).
  errorComponent: AppErrorScreen,
  // Une adresse inconnue : rendu dans l'`Outlet` de `RootLayout`.
  notFoundComponent: NotFoundScreen,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: HOME_PATH,
  component: App,
});

export const routeTree = rootRoute.addChildren([indexRoute]);
