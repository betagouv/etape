import {
  buildLoginUrl,
  createSessionQueryOptions,
  resolveStartupAccess,
  STARTUP_ERROR_NOTICE,
  STARTUP_PENDING_MESSAGE,
} from "@etape/api-client";
import { NoticeScreen } from "@etape/ui/components/notice-screen";
import { PendingScreen } from "@etape/ui/components/pending-screen";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, createRoute, redirect } from "@tanstack/react-router";
import type { AxiosInstance } from "axios";

import { App } from "../App";
import { API_BASE_URL } from "../lib/clients";
import { RootLayout } from "./root-layout";

export interface RouterContext {
  httpClient: AxiosInstance;
  queryClient: QueryClient;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  // Garde de démarrage : toute l'app est derrière la connexion.
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.query(createSessionQueryOptions(context.httpClient));
    const access = resolveStartupAccess(new URLSearchParams(location.searchStr), session);

    if (access.kind === "login-required") {
      // Navigation pleine page : le formulaire de connexion est servi par
      // Keycloak, via l'API, pas par cette app.
      throw redirect({ href: buildLoginUrl(API_BASE_URL, location.href), reloadDocument: true });
    }

    return { access };
  },
  component: RootLayout,
  pendingComponent: () => <PendingScreen message={STARTUP_PENDING_MESSAGE} />,
  // L'API ne répond pas : c'est la personne qui relance, pas une boucle.
  errorComponent: () => (
    <NoticeScreen {...STARTUP_ERROR_NOTICE} onAction={() => window.location.reload()} />
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: App,
});

export const routeTree = rootRoute.addChildren([indexRoute]);
