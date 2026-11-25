import { describe, expect, it } from "vitest";

import { parseHeures } from "./heures-formation";

describe("parseHeures", () => {
  it("lit un nombre entier, espaces autour compris", () => {
    expect(parseHeures("400")).toBe(400);
    expect(parseHeures(" 35 ")).toBe(35);
    expect(parseHeures("0")).toBe(0);
  });

  it("refuse ce qui n'est pas un nombre entier", () => {
    expect(parseHeures("")).toBeUndefined();
    expect(parseHeures("35,5")).toBeUndefined();
    expect(parseHeures("35 h")).toBeUndefined();
    expect(parseHeures("-3")).toBeUndefined();
  });
});
