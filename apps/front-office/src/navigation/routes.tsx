import { createRootRoute, createRoute, Outlet } from "@tanstack/react-router";

import { App } from "../App";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: App,
});

export const routeTree = rootRoute.addChildren([indexRoute]);
