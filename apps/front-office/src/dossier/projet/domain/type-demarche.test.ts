import { describe, expect, it } from "vitest";

import { TYPE_DEMARCHE_LABEL } from "./type-demarche";

describe("TYPE_DEMARCHE_LABEL", () => {
  it("propose six types, « Autre » en dernier", () => {
    const labels = Object.values(TYPE_DEMARCHE_LABEL);

    expect(labels).toHaveLength(6);
    expect(labels[0]).toBe("Bilan de compétences");
    expect(labels.at(-1)).toBe("Autre");
  });
});
