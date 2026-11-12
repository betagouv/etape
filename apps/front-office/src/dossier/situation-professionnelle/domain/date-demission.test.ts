import { describe, expect, it } from "vitest";

import {
  computeDateDemissionBounds,
  computeDateDemissionCalendar,
  isDateDemissionInFuture,
} from "./date-demission";

const TODAY = new Date(2026, 10, 11, 23, 30);

describe("computeDateDemissionBounds", () => {
  it("borne au jour même, à minuit quelle que soit l'heure", () => {
    expect(computeDateDemissionBounds(TODAY).max).toEqual(new Date(2026, 10, 11));
  });
});

describe("isDateDemissionInFuture", () => {
  it("reconnaît le lendemain comme une date à venir", () => {
    expect(isDateDemissionInFuture("12/11/2026", TODAY)).toBe(true);
  });

  it("ne retient ni le jour même ni la veille", () => {
    expect(isDateDemissionInFuture("11/11/2026", TODAY)).toBe(false);
    expect(isDateDemissionInFuture("10/11/2026", TODAY)).toBe(false);
  });

  it("ne retient pas une date vide ou illisible", () => {
    expect(isDateDemissionInFuture("", TODAY)).toBe(false);
    expect(isDateDemissionInFuture("demain", TODAY)).toBe(false);
  });
});

describe("computeDateDemissionCalendar", () => {
  it("s'ouvre sur le mois en cours et désactive les jours à venir", () => {
    const max = new Date(2026, 10, 11);
    expect(computeDateDemissionCalendar(TODAY)).toEqual({
      defaultMonth: max,
      endMonth: max,
      disabled: { after: max },
    });
  });
});
