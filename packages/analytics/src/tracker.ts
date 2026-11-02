import type { MatomoConfig } from "./config";
import type { AnalyticsApp, AnalyticsEvent } from "./events";

/**
 * La file de commandes de Matomo. Un tableau tant que `matomo.js` n'est pas
 * chargé ; le script le remplace ensuite par un objet dont `push` exécute
 * aussitôt la commande.
 */
interface MatomoQueue {
  push: (...commands: unknown[][]) => unknown;
}

declare global {
  interface Window {
    /** Absente tant que la mesure n'est pas initialisée : elle est alors désactivée. */
    _paq?: MatomoQueue;
  }
}

/** Sans file, la mesure est désactivée (aucun site ID) : la commande est ignorée. */
export function push(command: unknown[]): void {
  window._paq?.push(command);
}

/**
 * Crée la file si besoin. Réservé à ce qui ne s'exécute que lorsque la mesure est
 * active : une commande y attend le chargement du script.
 */
export function enqueue(command: unknown[]): void {
  const queue = (window._paq ??= [] as unknown[][]);
  queue.push(command);
}

/**
 * Coupe ce qui sort de l'exemption de consentement : cartes de chaleur et
 * enregistrements de session (guide de configuration CNIL, étape 3e). Jamais de
 * `setUserId`, de cross-domain ni de cookie tiers non plus.
 */
export function disableNonExemptFeatures(): void {
  push(["HeatmapSessionRecording::disable"]);
}

let isTrackerLoaded = false;

/**
 * Charge le tracker, une seule fois par page chargée. Pas de paquet tiers :
 * `@socialgouv/matomo-next`, essayé d'abord, embarquait `next/router` et des
 * modules inutilisés (proxy, A/B tests) dans chaque page, mesure désactivée comprise.
 */
export function loadTracker({ url, siteId }: MatomoConfig): void {
  if (isTrackerLoaded) return;
  isTrackerLoaded = true;

  enqueue(["setTrackerUrl", `${url}/matomo.php`]);
  enqueue(["setSiteId", siteId]);
  disableNonExemptFeatures();
  // Liens sortants et téléchargements seulement : les clics internes passent par
  // `startClickTracking`.
  push(["enableLinkTracking"]);

  const script = document.createElement("script");
  script.async = true;
  script.src = `${url}/matomo.js`;
  document.head.append(script);
}

/**
 * Une page vue. `path` ne doit contenir aucune donnée personnelle, pas plus que
 * `title`. Il est rendu absolu ici : Matomo résout un chemin relatif sur le seul
 * nom d'hôte et perdrait le port.
 */
export function trackPageView(path: string, title: string): void {
  push(["setCustomUrl", `${window.location.origin}${path}`]);
  push(["setDocumentTitle", title]);
  push(["trackPageView"]);
}

export function trackEvent(app: AnalyticsApp, event: AnalyticsEvent, label?: string): void {
  push(label === undefined ? ["trackEvent", app, event] : ["trackEvent", app, event, label]);
}

/**
 * Le chemin mesuré d'une app Next : `usePathname()` omet le `basePath`, sans quoi
 * les pages du simulateur se confondraient avec celles du site. La barre finale
 * suit `trailingSlash: true`, pour que la première page vue (URL réelle) et les
 * suivantes tombent sur la même ligne des rapports.
 */
export function toTrackedPath(basePath: string, pathname: string): string {
  const path = `${basePath}${pathname}`;
  return path.endsWith("/") ? path : `${path}/`;
}

/**
 * Compte une page vue par changement d'URL dans une app Next, URL passée absolue
 * et sans paramètres. Une URL identique à la précédente est ignorée : le double
 * montage de StrictMode ne compte pas deux pages.
 *
 * La première page vue garde l'URL réelle, paramètres compris : ceux de campagne
 * (`mtm_*`, `utm_*`) et l'écran `?q=` d'un simulateur rechargé. Les suivantes
 * posent l'URL donnée, avec la précédente pour référent. Tout part un tick plus
 * tard, quand Next a posé le titre de la nouvelle page.
 */
export function createPathViewTracker(): (url: string) => void {
  let previousUrl: string | undefined;

  return function trackPathView(url: string): void {
    if (url === previousUrl) return;

    const referrerUrl = previousUrl;
    previousUrl = url;

    window.setTimeout(() => {
      if (referrerUrl !== undefined) {
        push(["setReferrerUrl", referrerUrl]);
        push(["setCustomUrl", url]);
      }
      push(["setDocumentTitle", document.title]);
      push(["trackPageView"]);
    }, 0);
  };
}
