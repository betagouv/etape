import type { AnyRouter } from "@tanstack/react-router";

import { startClickTracking } from "./click-tracking";
import type { MatomoConfig } from "./config";
import type { AnalyticsApp } from "./events";
import { loadTracker, trackPageView } from "./tracker";

export interface RouterTrackingOptions {
  /** `null` : mesure désactivée, rien n'est chargé. */
  config: MatomoConfig | null;
  app: AnalyticsApp;
}

/**
 * La mesure d'audience d'une SPA TanStack Router : charge le tracker, compte une
 * page vue par changement de chemin, mesure les clics marqués par
 * `analyticsEventProps`.
 *
 * On mesure le motif de la route (`/dossiers/$dossierId`), jamais l'URL réelle ni
 * le titre du document : un identifiant de dossier ou le nom d'un bénéficiaire
 * n'a rien à faire dans Matomo (guide de configuration CNIL, étape 4).
 */
export function startRouterTracking(
  router: AnyRouter,
  { config, app }: RouterTrackingOptions,
): void {
  if (!config) return;

  loadTracker(config);
  startClickTracking(app);

  router.subscribe("onResolved", ({ pathChanged }) => {
    // Une invalidation (session rafraîchie) relance un chargement sans changer de
    // page. Au premier chargement, `pathChanged` vaut `true`.
    if (!pathChanged) return;

    const routePath = router.state.matches.at(-1)?.fullPath ?? "/";
    trackPageView(routePath, routePath);
  });
}
