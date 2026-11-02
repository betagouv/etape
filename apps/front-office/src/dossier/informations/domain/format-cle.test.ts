import { describe, expect, it } from "vitest";

import { formatCle } from "./format-cle";

describe("formatCle", () => {
  it("ne garde que les deux premiers chiffres", () => {
    expect(formatCle("8a0 7")).toBe("80");
    expect(formatCle("x")).toBe("");
  });
});
