import { describe, expect, it } from "vitest";

import { readMatomoConfig } from "./config";

const URL = "https://stats.beta.gouv.fr";

describe("readMatomoConfig", () => {
  it("désactive la mesure sans site ID, comme en dev local", () => {
    expect(readMatomoConfig({ url: URL, siteId: undefined })).toBeNull();
    expect(readMatomoConfig({ url: URL, siteId: "  " })).toBeNull();
  });

  it("désactive la mesure sans instance", () => {
    expect(readMatomoConfig({ url: "", siteId: "272" })).toBeNull();
  });

  it("retire le slash final, que le tracker ajoute lui-même", () => {
    expect(readMatomoConfig({ url: `${URL}/`, siteId: " 272 " })).toEqual({
      url: URL,
      siteId: "272",
    });
    expect(readMatomoConfig({ url: `${URL}///`, siteId: "272" })?.url).toBe(URL);
  });

  it("désactive la mesure quand l'instance n'est faite que de slashs", () => {
    expect(readMatomoConfig({ url: "///", siteId: "272" })).toBeNull();
  });
});
