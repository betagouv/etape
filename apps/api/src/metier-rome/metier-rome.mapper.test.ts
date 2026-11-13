import { describe, expect, it } from "vitest";

import { toSearchAppellationsRomeResponse } from "./metier-rome.mapper.js";
import type { MetierRome } from "./metier-rome.types.js";

const DEVELOPPEUR_WEB: MetierRome = {
  code: "M1855",
  libelle: "Développeur / Développeuse web",
  appellations: [],
};

describe("toSearchAppellationsRomeResponse", () => {
  it("ne laisse sortir que les champs du contrat", () => {
    const response = toSearchAppellationsRomeResponse({
      appellationRomeCount: 3,
      appellationsRome: [
        {
          code: "38745",
          libelle: "Développeur / Développeuse web mobile",
          metierRome: DEVELOPPEUR_WEB,
        },
      ],
    });

    expect(response).toEqual({
      appellationRomeCount: 3,
      appellationsRome: [
        {
          code: "38745",
          libelle: "Développeur / Développeuse web mobile",
          metierRome: { code: "M1855", libelle: "Développeur / Développeuse web" },
        },
      ],
    });
  });
});
