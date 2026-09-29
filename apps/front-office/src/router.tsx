import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";

import { App } from "./App";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: App,
});

const routeTree = rootRoute.addChildren([indexRoute]);

export const router = createRouter({ routeTree });

// Permet à useNavigate/useParams d'inférer les routes de cette app plutôt
// que le type générique de la bibliothèque.
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
