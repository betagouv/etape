import { describe, expect, it } from "vitest";

import { formatFieldDate } from "../../domain/field-date";
import {
  computeDateNaissanceBounds,
  computeDateNaissanceCalendar,
  isAgeMaximumRespected,
  isAgeMinimumRespected,
} from "./date-naissance";

const TODAY = new Date(2026, 10, 4, 23, 30);

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

describe("isAgeMinimumRespected", () => {
  it("accepte 18 ans le jour même, pas la veille de cet anniversaire", () => {
    expect(isAgeMinimumRespected("04/11/2008", TODAY)).toBe(true);
    expect(isAgeMinimumRespected("05/11/2008", TODAY)).toBe(false);
  });

  it("refuse une date vide ou illisible", () => {
    expect(isAgeMinimumRespected("", TODAY)).toBe(false);
    expect(isAgeMinimumRespected("hier", TODAY)).toBe(false);
  });
});

describe("isAgeMaximumRespected", () => {
  it("accepte 70 ans le jour même, pas le lendemain de cet anniversaire", () => {
    expect(isAgeMaximumRespected("04/11/1956", TODAY)).toBe(true);
    expect(isAgeMaximumRespected("03/11/1956", TODAY)).toBe(false);
  });

  it("refuse une date vide ou illisible", () => {
    expect(isAgeMaximumRespected("", TODAY)).toBe(false);
    expect(isAgeMaximumRespected("hier", TODAY)).toBe(false);
  });
});

describe("computeDateNaissanceCalendar", () => {
  it("s'ouvre sur janvier 1990 et se limite aux naissances acceptées", () => {
    const min = new Date(1956, 10, 4);
    const max = new Date(2008, 10, 4);
    expect(computeDateNaissanceCalendar(TODAY)).toEqual({
      defaultMonth: new Date(1990, 0),
      startMonth: min,
      endMonth: max,
      disabled: { before: min, after: max },
    });
  });
});
