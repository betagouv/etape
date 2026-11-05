import { describe, expect, it } from "vitest";

import { informationsSchema } from "./schema";

const CLE_MISMATCH =
  "La clé ne correspond pas au numéro : vérifiez les 2 derniers chiffres de votre carte Vitale.";

function findCleNirMessages(data: Record<string, string>): string[] {
  const issues = informationsSchema.safeParse(data).error?.issues ?? [];
  return issues.filter((issue) => issue.path[0] === "cleNir").map((issue) => issue.message);
}

const VALIDES = {
  civilite: "madame",
  dateNaissance: "15/01/1990",
  nationalite: "Française",
  nir: "1 85 05 78 006 084",
  cleNir: "91",
  telephone: "06 12 34 56 78",
};

describe("informationsSchema, clé du NIR", () => {
  it("accepte la clé qui correspond au NIR", () => {
    expect(findCleNirMessages(VALIDES)).toEqual([]);
  });

  it("refuse une clé qui ne correspond pas au NIR, même quand la civilité est vide", () => {
    expect(findCleNirMessages({ ...VALIDES, cleNir: "12" })).toEqual([CLE_MISMATCH]);
    expect(findCleNirMessages({ ...VALIDES, cleNir: "12", civilite: "" })).toEqual([CLE_MISMATCH]);
  });

  it("ne compare pas la clé à un NIR incomplet", () => {
    expect(findCleNirMessages({ ...VALIDES, nir: "1 85", cleNir: "12" })).toEqual([]);
  });
});
