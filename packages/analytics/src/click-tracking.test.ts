import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { analyticsEventProps, startClickTracking } from "./click-tracking";
import { ANALYTICS_APP, ANALYTICS_EVENT } from "./events";

let stopClickTracking: () => void;

beforeEach(() => {
  window._paq = [] as unknown[][];
  stopClickTracking = startClickTracking(ANALYTICS_APP.SITE);
});

afterEach(() => {
  stopClickTracking();
  delete window._paq;
  document.body.innerHTML = "";
});

/** Un lien marqué, avec un enfant : le clic part souvent du texte ou de l'icône. */
function renderLink(attributes: Record<string, string>): HTMLElement {
  const link = document.createElement("a");
  link.href = "#";
  Object.entries(attributes).forEach(([name, value]) => link.setAttribute(name, value));
  const label = document.createElement("span");
  label.textContent = "Faire la simulation";
  link.append(label);
  document.body.append(link);
  return label;
}

describe("startClickTracking", () => {
  it("mesure un clic parti d'un enfant de l'élément marqué, avec son libellé", () => {
    renderLink({ ...analyticsEventProps(ANALYTICS_EVENT.ACCES_SIMULATEUR, "hero") });

    document.querySelector("span")?.click();

    expect(window._paq).toEqual([["trackEvent", "site", "acces_simulateur", "hero"]]);
  });

  it("mesure un event sans libellé", () => {
    renderLink({ ...analyticsEventProps(ANALYTICS_EVENT.SIMULATEUR_TELECHARGER_PDF) });

    document.querySelector("span")?.click();

    expect(window._paq).toEqual([["trackEvent", "site", "simulateur_telecharger_pdf"]]);
  });

  it("ignore un event absent du catalogue", () => {
    renderLink({ "data-analytics-event": "email_saisi" });

    document.querySelector("span")?.click();

    expect(window._paq).toEqual([]);
  });

  it("ignore un clic hors élément marqué", () => {
    renderLink({});

    document.querySelector("span")?.click();

    expect(window._paq).toEqual([]);
  });

  it("ne mesure plus rien une fois arrêté", () => {
    renderLink({ ...analyticsEventProps(ANALYTICS_EVENT.ACCES_SIMULATEUR) });
    stopClickTracking();

    document.querySelector("span")?.click();

    expect(window._paq).toEqual([]);
  });
});
