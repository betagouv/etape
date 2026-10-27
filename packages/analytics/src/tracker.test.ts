import { afterEach, describe, expect, it } from "vitest";

import { ANALYTICS_APP, ANALYTICS_EVENT } from "./events";
import { loadTracker, toTrackedPath, trackEvent, trackPageView } from "./tracker";

afterEach(() => {
  delete window._paq;
  document.head.innerHTML = "";
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
