import { describe, expect, it } from "vitest";

import { formatFieldDate } from "../../domain/field-date";
import { computeDateNaissanceBounds } from "./date-naissance";

function formatBounds(today: Date): { min: string; max: string } {
  const { min, max } = computeDateNaissanceBounds(today);
  return { min: formatFieldDate(min), max: formatFieldDate(max) };
}

describe("computeDateNaissanceBounds", () => {
  it("borne à 18 et 70 ans le jour même", () => {
    expect(formatBounds(new Date(2026, 10, 4))).toEqual({ min: "04/11/1956", max: "04/11/2008" });
  });

  it("ramène un 29 février au 28 d'une année non bissextile", () => {
    expect(formatBounds(new Date(2028, 1, 29))).toEqual({ min: "28/02/1958", max: "28/02/2010" });
  });

  it("place les bornes à minuit, quelle que soit l'heure", () => {
    const { min, max } = computeDateNaissanceBounds(new Date(2026, 10, 4, 23, 30));
    expect(min).toEqual(new Date(1956, 10, 4));
    expect(max).toEqual(new Date(2008, 10, 4));
  });
});
