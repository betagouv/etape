import { describe, expect, it } from "vitest";

import { MAX_RETURN_TO_LENGTH, sanitizeReturnTo } from "./return-to.js";

describe("sanitizeReturnTo", () => {
  it("garde un chemin interne", () => {
    expect(sanitizeReturnTo("/compte/")).toBe("/compte/");
    expect(sanitizeReturnTo("/simulateur/questionnaire/?q=origine")).toBe(
      "/simulateur/questionnaire/?q=origine",
    );
  });

  it("revient à la racine sans destination", () => {
    expect(sanitizeReturnTo(undefined)).toBe("/");
    expect(sanitizeReturnTo("")).toBe("/");
    expect(sanitizeReturnTo(["/compte/"])).toBe("/");
  });

  it("refuse une URL absolue", () => {
    expect(sanitizeReturnTo("https://exemple.test")).toBe("/");
  });

  it("refuse une URL relative au protocole", () => {
    expect(sanitizeReturnTo("//exemple.test")).toBe("/");
  });

  it("refuse une barre oblique inverse, normalisée en / par les navigateurs", () => {
    expect(sanitizeReturnTo("/\\exemple.test")).toBe("/");
  });

  it("refuse une destination plus longue que la borne", () => {
    const atLimit = `/${"a".repeat(MAX_RETURN_TO_LENGTH - 1)}`;

    expect(sanitizeReturnTo(atLimit)).toBe(atLimit);
    expect(sanitizeReturnTo(`${atLimit}a`)).toBe("/");
  });
});
