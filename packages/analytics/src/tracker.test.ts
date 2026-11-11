import { afterEach, describe, expect, it, vi } from "vitest";

import { ANALYTICS_APP, ANALYTICS_EVENT } from "./events";
import {
  createPathViewTracker,
  loadTracker,
  toTrackedPath,
  trackEvent,
  trackPageView,
} from "./tracker";

afterEach(() => {
  delete window._paq;
  document.head.innerHTML = "";
  document.title = "";
  vi.useRealTimers();
});

describe("sans tracker", () => {
  it("ignore les commandes au lieu de créer une file que personne ne lira", () => {
    trackEvent(ANALYTICS_APP.SITE, ANALYTICS_EVENT.ACCES_SIMULATEUR);
    trackPageView("/", "ETAPE");

    expect(window._paq).toBeUndefined();
  });
});

describe("loadTracker", () => {
  it("configure le site, coupe les fonctions hors exemption et charge le script une seule fois", () => {
    const config = { url: "https://stats.beta.gouv.fr", siteId: "272" };

    loadTracker(config);
    loadTracker(config);

    expect(window._paq).toEqual([
      ["setTrackerUrl", "https://stats.beta.gouv.fr/matomo.php"],
      ["setSiteId", "272"],
      ["HeatmapSessionRecording::disable"],
      ["enableLinkTracking"],
    ]);
    const scripts = document.head.querySelectorAll("script");
    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.src).toBe("https://stats.beta.gouv.fr/matomo.js");
    expect(scripts[0]?.async).toBe(true);
  });
});

describe("avec tracker", () => {
  it("pose l'URL absolue et le titre avant la page vue", () => {
    window._paq = [] as unknown[][];

    trackPageView("/dossiers/$dossierId", "/dossiers/$dossierId");

    expect(window._paq).toEqual([
      ["setCustomUrl", `${window.location.origin}/dossiers/$dossierId`],
      ["setDocumentTitle", "/dossiers/$dossierId"],
      ["trackPageView"],
    ]);
  });

  it("n'ajoute le libellé d'un event que s'il est donné", () => {
    window._paq = [] as unknown[][];

    trackEvent(ANALYTICS_APP.SIMULATEUR, ANALYTICS_EVENT.SIMULATEUR_DEMARRER);
    trackEvent(ANALYTICS_APP.SITE, ANALYTICS_EVENT.ACCES_SIMULATEUR, "hero");

    expect(window._paq).toEqual([
      ["trackEvent", "simulateur", "simulateur_demarrer"],
      ["trackEvent", "site", "acces_simulateur", "hero"],
    ]);
  });
});

describe("toTrackedPath", () => {
  it("remet le basePath que `usePathname()` omet", () => {
    expect(toTrackedPath("/simulateur", "/questionnaire")).toBe("/simulateur/questionnaire/");
  });

  it("aligne la barre finale sur `trailingSlash: true`", () => {
    expect(toTrackedPath("", "/mentions-legales")).toBe("/mentions-legales/");
    expect(toTrackedPath("", "/")).toBe("/");
    expect(toTrackedPath("/simulateur", "/")).toBe("/simulateur/");
  });
});

describe("createPathViewTracker", () => {
  const ACCUEIL = "https://etape.example/";
  const MENTIONS = "https://etape.example/mentions-legales/";

  it("garde l'URL réelle à la première page vue, pour ses paramètres de campagne", () => {
    vi.useFakeTimers();
    window._paq = [] as unknown[][];
    document.title = "ETAPE";

    createPathViewTracker()(ACCUEIL);
    expect(window._paq).toEqual([]);

    vi.runAllTimers();
    expect(window._paq).toEqual([["setDocumentTitle", "ETAPE"], ["trackPageView"]]);
  });

  it("pose l'URL et le référent aux suivantes, avec le titre de la nouvelle page", () => {
    vi.useFakeTimers();
    window._paq = [] as unknown[][];
    const trackPathView = createPathViewTracker();
    trackPathView(ACCUEIL);
    vi.runAllTimers();
    window._paq = [] as unknown[][];

    trackPathView(MENTIONS);
    document.title = "Mentions légales";
    vi.runAllTimers();

    expect(window._paq).toEqual([
      ["setReferrerUrl", ACCUEIL],
      ["setCustomUrl", MENTIONS],
      ["setDocumentTitle", "Mentions légales"],
      ["trackPageView"],
    ]);
  });

  it("ne compte pas deux fois la même URL (double montage de StrictMode)", () => {
    vi.useFakeTimers();
    window._paq = [] as unknown[][];
    const trackPathView = createPathViewTracker();

    trackPathView(ACCUEIL);
    trackPathView(ACCUEIL);
    vi.runAllTimers();

    expect(window._paq).toEqual([["setDocumentTitle", ""], ["trackPageView"]]);
  });
});
