import { describe, expect, it } from "vitest";

import { formatUpdatedAt } from "./updated-at";

const NOW = new Date(2026, 9, 27, 16, 0);

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
