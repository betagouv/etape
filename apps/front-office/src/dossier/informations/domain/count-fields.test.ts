import { describe, expect, it } from "vitest";

import { countFilled, countInvalid, listFilledFields } from "./count-fields";

describe("listFilledFields", () => {
  it("ne garde que les champs demandés qui ont une valeur", () => {
    expect(
      listFilledFields({ civilite: "madame", dateNaissance: "", telephone: "06 12 34 56 78" }, [
        "civilite",
        "dateNaissance",
        "nationalite",
      ]),
    ).toEqual(["civilite"]);
  });
});

describe("countFilled", () => {
  it("compte les champs demandés parmi les champs remplis", () => {
    expect(countFilled(["civilite", "telephone"], ["civilite", "dateNaissance"])).toBe(1);
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
