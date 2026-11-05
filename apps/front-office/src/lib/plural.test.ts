import { describe, expect, it } from "vitest";

import { selectPlural } from "./plural";

const FORMS = { one: "champ", other: "champs" };

describe("selectPlural", () => {
  it("met 0 et 1 au singulier", () => {
    expect(selectPlural(0, FORMS)).toBe("champ");
    expect(selectPlural(1, FORMS)).toBe("champ");
  });

  it("met 2 et plus au pluriel", () => {
    expect(selectPlural(2, FORMS)).toBe("champs");
  });

  it("se replie sur `other` pour une catégorie non renseignée", () => {
    expect(selectPlural(1_000_000, FORMS)).toBe("champs");
  });
});
