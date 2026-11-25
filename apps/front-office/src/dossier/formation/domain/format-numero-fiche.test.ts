import { describe, expect, it } from "vitest";

import { formatNumeroFiche } from "./format-numero-fiche";

describe("formatNumeroFiche", () => {
  it("retire les espaces et met en majuscules", () => {
    expect(formatNumeroFiche(" rncp 12 345 ")).toBe("RNCP12345");
  });
});
