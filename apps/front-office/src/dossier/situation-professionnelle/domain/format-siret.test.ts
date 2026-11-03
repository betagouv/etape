import { describe, expect, it } from "vitest";

import { formatSiret } from "./format-siret";

describe("formatSiret", () => {
  it("groupe le SIREN par trois chiffres et isole le NIC", () => {
    expect(formatSiret("50393256800010")).toBe("503 932 568 00010");
  });
});
