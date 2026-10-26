import { HOME_PATH, sessionRootRoute } from "@etape/session";
import { createRoute } from "@tanstack/react-router";

import { App } from "../App";

// Garde de démarrage, avis et dialogue d'expiration : communs aux deux fronts,
// dans `@etape/session`.
const indexRoute = createRoute({
  getParentRoute: () => sessionRootRoute,
  path: HOME_PATH,
  component: App,
});

export const routeTree = sessionRootRoute.addChildren([indexRoute]);
