import { describe, expect, it } from "vitest";

import { findRegionByCodeCommune, isRegionPilote } from "./region";

describe("findRegionByCodeCommune", () => {
  it.each([
    ["33063", "75"],
    ["44109", "52"],
    ["75101", "11"],
    ["2A004", "94"],
    ["2B033", "94"],
    ["97105", "01"],
    ["97411", "04"],
    ["97608", "06"],
  ])("rattache %s à la région %s", (codeCommune, region) => {
    expect(findRegionByCodeCommune(codeCommune)).toBe(region);
  });

  it.each(["97501", "98714", ""])("ne trouve aucune région pour « %s »", (codeCommune) => {
    expect(findRegionByCodeCommune(codeCommune)).toBeUndefined();
  });
});

describe("isRegionPilote", () => {
  it("accepte une région de la liste", () => {
    expect(isRegionPilote("75", ["75"])).toBe(true);
  });

  it("refuse une autre région, ou une commune sans région", () => {
    expect(isRegionPilote("52", ["75"])).toBe(false);
    expect(isRegionPilote(undefined, ["75"])).toBe(false);
  });

  it("ne refuse rien quand le profil ne déclare aucune liste", () => {
    expect(isRegionPilote("52", [])).toBe(true);
  });
});
