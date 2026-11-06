"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { startClickTracking } from "./click-tracking";
import type { MatomoConfig } from "./config";
import type { AnalyticsApp } from "./events";
import { createPathViewTracker, loadTracker, toTrackedPath } from "./tracker";

/** Au niveau du module : survit au double montage de StrictMode et aux changements de page. */
const trackPathView = createPathViewTracker();

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

  // Avant l'effet des pages vues : les effets s'exécutent dans l'ordre de
  // déclaration, et la file doit exister avant la première page vue.
  useEffect(() => {
    if (!config) return;
    loadTracker(config);
    return startClickTracking(app);
  }, [config, app]);

  useEffect(() => {
    if (!config) return;
    // Absolue : Matomo résout une URL relative sur le seul nom d'hôte, sans le port.
    trackPathView(`${window.location.origin}${toTrackedPath(basePath, pathname)}`);
  }, [config, basePath, pathname]);

  return null;
}
