import { describe, expect, it } from "vitest";

import type { PluralForms } from "@/lib/plural";
import { formatResultCount, hasMoreResults } from "./format-result-count";

const FOUND_LABELS: PluralForms<string> = {
  one: "établissement trouvé",
  other: "établissements trouvés",
};

describe("formatResultCount", () => {
  it("compte les résultats affichés sur le total quand l'API n'en renvoie qu'une partie", () => {
    expect(formatResultCount(20, 45451, FOUND_LABELS)).toBe("20 établissements trouvés sur 45 451");
  });

  it("ne mentionne pas le total quand tout est affiché", () => {
    expect(formatResultCount(3, 3, FOUND_LABELS)).toBe("3 établissements trouvés");
    expect(formatResultCount(1, 1, FOUND_LABELS)).toBe("1 établissement trouvé");
  });
});

describe("hasMoreResults", () => {
  it("est vrai seulement quand l'API en a trouvé plus qu'elle n'en renvoie", () => {
    expect(hasMoreResults(20, 45451)).toBe(true);
    expect(hasMoreResults(20, 20)).toBe(false);
    expect(hasMoreResults(0, 0)).toBe(false);
  });
});
