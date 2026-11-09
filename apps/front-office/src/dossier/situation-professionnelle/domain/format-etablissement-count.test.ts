import { describe, expect, it } from "vitest";

import { formatEtablissementCount, hasMoreEtablissements } from "./format-etablissement-count";

describe("formatEtablissementCount", () => {
  it("compte les établissements affichés sur le total quand l'API n'en renvoie qu'une partie", () => {
    expect(formatEtablissementCount(20, 45451)).toBe("20 établissements trouvés sur 45 451");
  });

  it("ne mentionne pas le total quand tout est affiché", () => {
    expect(formatEtablissementCount(3, 3)).toBe("3 établissements trouvés");
    expect(formatEtablissementCount(1, 1)).toBe("1 établissement trouvé");
  });
});

describe("hasMoreEtablissements", () => {
  it("est vrai seulement quand l'API en a trouvé plus qu'elle n'en renvoie", () => {
    expect(hasMoreEtablissements(20, 45451)).toBe(true);
    expect(hasMoreEtablissements(20, 20)).toBe(false);
    expect(hasMoreEtablissements(0, 0)).toBe(false);
  });
});
