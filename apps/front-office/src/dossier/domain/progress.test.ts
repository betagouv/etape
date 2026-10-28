import { describe, expect, it } from "vitest";

import {
  computeDossierProgress,
  computeProgressPercent,
  formatUpdatedAt,
  formatVoletsLabel,
} from "./progress";

const NOW = new Date(2026, 9, 27, 16, 0);

describe("computeDossierProgress", () => {
  it("compte les volets complets et facultatifs, pas ceux à remplir, en cours ou à corriger", () => {
    expect(
      computeDossierProgress([
        { requiredFieldCount: 5, filledFieldCount: 5, remainingFieldCount: 0, errorCount: 0 },
        { requiredFieldCount: 0, filledFieldCount: 0, remainingFieldCount: 0, errorCount: 0 },
        { requiredFieldCount: 5, filledFieldCount: 5, remainingFieldCount: 0, errorCount: 1 },
        { requiredFieldCount: 5, filledFieldCount: 2, remainingFieldCount: 3, errorCount: 0 },
        { requiredFieldCount: 4, filledFieldCount: 0, remainingFieldCount: 4, errorCount: 0 },
      ]),
    ).toEqual({ completed: 2, total: 5 });
  });
});

describe("formatUpdatedAt", () => {
  it("donne l'heure seule pour un enregistrement du jour", () => {
    expect(formatUpdatedAt(new Date(2026, 9, 27, 14, 32), NOW)).toBe("à 14:32");
  });

  it("ajoute la date pour un enregistrement d'un autre jour", () => {
    expect(formatUpdatedAt(new Date(2026, 9, 26, 9, 5), NOW)).toBe("le 26/10 à 09:05");
  });

  it("change de jour à minuit, pas vingt-quatre heures plus tard", () => {
    const justAfterMidnight = new Date(2026, 9, 27, 0, 1);

    expect(formatUpdatedAt(new Date(2026, 9, 26, 23, 59), justAfterMidnight)).toBe(
      "le 26/10 à 23:59",
    );
  });
});

describe("formatVoletsLabel", () => {
  it("accorde le libellé au singulier pour zéro et un volet", () => {
    expect(formatVoletsLabel({ completed: 0, total: 5 })).toBe("section sur 5 complétée");
    expect(formatVoletsLabel({ completed: 1, total: 5 })).toBe("section sur 5 complétée");
  });

  it("accorde le libellé au pluriel à partir de deux volets", () => {
    expect(formatVoletsLabel({ completed: 2, total: 5 })).toBe("sections sur 5 complétées");
  });
});

describe("computeProgressPercent", () => {
  it("rapporte les volets complétés au total", () => {
    expect(computeProgressPercent({ completed: 0, total: 5 })).toBe(0);
    expect(computeProgressPercent({ completed: 2, total: 5 })).toBe(40);
    expect(computeProgressPercent({ completed: 5, total: 5 })).toBe(100);
  });

  it("vaut 0 quand le dossier n'a aucun volet", () => {
    expect(computeProgressPercent({ completed: 0, total: 0 })).toBe(0);
  });
});
