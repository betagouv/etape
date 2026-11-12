import { describe, expect, it } from "vitest";

import { formatSiret } from "./format-siret";

describe("formatSiret", () => {
  it("groupe le SIREN par trois chiffres et isole le NIC", () => {
    expect(formatSiret("50393256800010")).toBe("503 932 568 00010");
  });

  it("groupe une saisie en cours, sans espace finale", () => {
    expect(formatSiret("")).toBe("");
    expect(formatSiret("503")).toBe("503");
    expect(formatSiret("5039")).toBe("503 9");
    expect(formatSiret("5039325680")).toBe("503 932 568 0");
  });

  it("retire tout ce qui n'est pas un chiffre", () => {
    expect(formatSiret("503-932 x568.00010")).toBe("503 932 568 00010");
  });

  it("tronque à 14 chiffres", () => {
    expect(formatSiret("5039325680001099")).toBe("503 932 568 00010");
  });
});
