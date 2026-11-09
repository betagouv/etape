import { describe, expect, it } from "vitest";

import { findNationalites } from "./nationalites";

describe("findNationalites", () => {
  it("ignore les espaces autour de la recherche", () => {
    expect(findNationalites(" fra").map((n) => n.label)).toEqual(["Française"]);
    expect(findNationalites("fra ").map((n) => n.label)).toEqual(["Française"]);
  });

  it("ignore les accents et la casse", () => {
    expect(findNationalites("EQUATO").map((n) => n.label)).toEqual([
      "Équatoguinéenne",
      "Équatorienne",
    ]);
  });
});
