import { describe, expect, it } from "vitest";

import { TYPE_DEMARCHE_LABEL } from "./type-demarche";

describe("TYPE_DEMARCHE_LABEL", () => {
  it("propose neuf types, « Autre » en dernier", () => {
    const labels = Object.values(TYPE_DEMARCHE_LABEL);

    expect(labels).toHaveLength(9);
    expect(labels[0]).toBe("Immersion en entreprise (stage d’observation, PMSMP)");
    expect(labels.at(-1)).toBe("Autre");
  });
});
