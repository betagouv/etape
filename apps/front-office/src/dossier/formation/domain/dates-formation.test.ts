import { describe, expect, it } from "vitest";

import {
  computeDateDebutFormationCalendar,
  computeDateFinFormationCalendar,
  computeDatesFormationBounds,
  isDateDebutFormationAfterHorizon,
  isDateFinBeforeDebut,
  isDateFinFormationAfterHorizon,
  isDateFormationInPast,
} from "./dates-formation";

/** Un après-midi : les bornes partent du début de la journée. */
const TODAY = new Date(2026, 10, 25, 15, 30);

describe("computeDatesFormationBounds", () => {
  it("va d'aujourd'hui, à minuit, à dans trois ans pour le début et six ans pour la fin", () => {
    expect(computeDatesFormationBounds(TODAY)).toEqual({
      min: new Date(2026, 10, 25),
      maxDebut: new Date(2029, 10, 25),
      maxFin: new Date(2032, 10, 25),
    });
  });
});

describe("isDateFormationInPast", () => {
  it("refuse hier et accepte aujourd'hui", () => {
    expect(isDateFormationInPast("24/11/2026", TODAY)).toBe(true);
    expect(isDateFormationInPast("25/11/2026", TODAY)).toBe(false);
  });

  it("laisse au contrôle du champ vide une date absente", () => {
    expect(isDateFormationInPast("", TODAY)).toBe(false);
  });
});

describe("isDateDebutFormationAfterHorizon", () => {
  it("accepte le dernier jour de l'horizon et refuse le lendemain", () => {
    expect(isDateDebutFormationAfterHorizon("25/11/2029", TODAY)).toBe(false);
    expect(isDateDebutFormationAfterHorizon("26/11/2029", TODAY)).toBe(true);
  });
});

describe("isDateFinFormationAfterHorizon", () => {
  it("accepte une fin au-delà de l'horizon du début, jusqu'à six ans", () => {
    expect(isDateFinFormationAfterHorizon("26/11/2029", TODAY)).toBe(false);
    expect(isDateFinFormationAfterHorizon("25/11/2032", TODAY)).toBe(false);
    expect(isDateFinFormationAfterHorizon("26/11/2032", TODAY)).toBe(true);
  });
});

describe("isDateFinBeforeDebut", () => {
  it("refuse une fin le jour du début ou avant", () => {
    expect(isDateFinBeforeDebut("05/01/2027", "05/01/2027")).toBe(true);
    expect(isDateFinBeforeDebut("04/01/2027", "05/01/2027")).toBe(true);
  });

  it("accepte une fin le lendemain du début", () => {
    expect(isDateFinBeforeDebut("06/01/2027", "05/01/2027")).toBe(false);
  });

  it("ne compare rien tant qu'une des deux dates manque", () => {
    expect(isDateFinBeforeDebut("", "05/01/2027")).toBe(false);
    expect(isDateFinBeforeDebut("06/01/2027", "")).toBe(false);
  });
});

describe("computeDateDebutFormationCalendar", () => {
  it("s'ouvre sur aujourd'hui et grise les jours passés et ceux après l'horizon", () => {
    const min = new Date(2026, 10, 25);
    const max = new Date(2029, 10, 25);
    expect(computeDateDebutFormationCalendar(TODAY)).toEqual({
      defaultMonth: min,
      startMonth: min,
      endMonth: max,
      disabled: { before: min, after: max },
    });
  });
});

describe("computeDateFinFormationCalendar", () => {
  it("part du lendemain de la date de début et va jusqu'à six ans", () => {
    const first = new Date(2027, 0, 6);
    const maxFin = new Date(2032, 10, 25);
    expect(computeDateFinFormationCalendar(TODAY, "05/01/2027")).toEqual({
      defaultMonth: first,
      startMonth: first,
      endMonth: maxFin,
      disabled: { before: first, after: maxFin },
    });
  });

  it("part d'aujourd'hui sans date de début, ou avec une date de début passée", () => {
    const min = new Date(2026, 10, 25);
    expect(computeDateFinFormationCalendar(TODAY, "").disabled.before).toEqual(min);
    expect(computeDateFinFormationCalendar(TODAY, "01/01/2026").disabled.before).toEqual(min);
  });
});
