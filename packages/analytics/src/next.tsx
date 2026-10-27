"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackAppRouter } from "@socialgouv/matomo-next";

import { startClickTracking } from "./click-tracking";
import type { MatomoConfig } from "./config";
import type { AnalyticsApp } from "./events";
import { disableNonExemptFeatures, toTrackedPath } from "./tracker";

export interface MatomoAnalyticsProps {
  /** `null` : mesure désactivée, rien n'est chargé. */
  config: MatomoConfig | null;
  app: AnalyticsApp;
  /** Le `basePath` de l'app, que `usePathname()` omet. */
  basePath?: string;
}

/**
 * La mesure d'audience d'une app Next exportée statiquement : charge le tracker,
 * compte une page vue à chaque changement de chemin, mesure les clics marqués par
 * `analyticsEventProps`. Ne rend rien.
 *
 * Les paramètres d'URL ne déclenchent pas de page vue : le `replaceState` qui
 * normalise `?q=` au premier chargement du simulateur en compterait une seconde.
 * Les étapes du questionnaire se mesurent dans le simulateur lui-même.
 */
export function MatomoAnalytics({ config, app, basePath = "" }: MatomoAnalyticsProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!config) return;

    trackAppRouter({
      url: config.url,
      siteId: config.siteId,
      // Le proxy de `matomo-next` demande un serveur Next : l'export statique n'en a pas.
      useProxy: false,
      // Absolue : Matomo résout une URL relative sur le seul nom d'hôte, sans le port.
      pathname: `${window.location.origin}${toTrackedPath(basePath, pathname)}`,
      onInitialization: disableNonExemptFeatures,
    });
  }, [config, basePath, pathname]);

  useEffect(() => {
    if (!config) return;
    return startClickTracking(app);
  }, [config, app]);

  return null;
}
