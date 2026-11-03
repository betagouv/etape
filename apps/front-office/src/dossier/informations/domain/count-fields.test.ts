import { describe, expect, it } from "vitest";

import { countFilled, countInvalid } from "./count-fields";

describe("countFilled", () => {
  it("ne compte que les champs demandés qui ont une valeur", () => {
    expect(
      countFilled({ civilite: "madame", dateNaissance: "", telephone: "06 12 34 56 78" }, [
        "civilite",
        "dateNaissance",
        "nationalite",
      ]),
    ).toBe(1);
  });
});

describe("countInvalid", () => {
  it("compte les erreurs des champs demandés", () => {
    expect(
      countInvalid({ cleNir: { message: "x" }, telephone: { message: "y" } }, [
        "cleNir",
        "civilite",
      ]),
    ).toBe(1);
  });
});
