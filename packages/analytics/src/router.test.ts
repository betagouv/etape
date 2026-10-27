import type { AnyRouter } from "@tanstack/react-router";
import { afterEach, describe, expect, it } from "vitest";

import { ANALYTICS_APP } from "./events";
import { startRouterTracking } from "./router";

afterEach(() => {
  delete window._paq;
});

type ResolvedListener = (event: { pathChanged: boolean }) => void;

/** Juste ce que `startRouterTracking` lit du routeur. */
function createFakeRouter() {
  const listeners: ResolvedListener[] = [];
  const router = {
    state: { matches: [{ fullPath: "/" }] },
    subscribe: (_type: string, listener: ResolvedListener) => {
      listeners.push(listener);
      return () => undefined;
    },
  };

  return {
    router: router as unknown as AnyRouter,
    resolve(fullPath: string, pathChanged = true) {
      router.state.matches = [{ fullPath: "/" }, { fullPath }];
      listeners.forEach((listener) => listener({ pathChanged }));
    },
  };
}

const PAGE_VIEW_COMMANDS = 3;

describe("startRouterTracking", () => {
  it("ne charge rien quand la mesure est désactivée", () => {
    const { router, resolve } = createFakeRouter();

    startRouterTracking(router, { config: null, app: ANALYTICS_APP.FRONT_OFFICE });
    resolve("/");

    expect(window._paq).toBeUndefined();
  });

  it("mesure le motif de la route, jamais l'URL réelle", () => {
    const { router, resolve } = createFakeRouter();
    startRouterTracking(router, {
      config: { url: "https://stats.beta.gouv.fr", siteId: "272" },
      app: ANALYTICS_APP.BACK_OFFICE,
    });
    const queue = window._paq as unknown[][];
    const configCommands = queue.length;

    resolve("/dossiers/$dossierId");
    // Une invalidation recharge la même page : pas de nouvelle page vue.
    resolve("/dossiers/$dossierId", false);

    expect(queue.slice(configCommands)).toEqual([
      ["setCustomUrl", `${window.location.origin}/dossiers/$dossierId`],
      ["setDocumentTitle", "/dossiers/$dossierId"],
      ["trackPageView"],
    ]);
    expect(queue).toHaveLength(configCommands + PAGE_VIEW_COMMANDS);
  });
});
