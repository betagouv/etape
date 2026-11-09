import { describe, expect, it } from "vitest";

import { formatCleNir } from "./format-cle-nir";

describe("formatCleNir", () => {
  it("ne garde que les deux premiers chiffres", () => {
    expect(formatCleNir("8a0 7")).toBe("80");
    expect(formatCleNir("x")).toBe("");
  });
});
