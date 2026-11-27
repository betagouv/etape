import { describe, expect, it } from "vitest";

import { findSectionFields } from "./section-fields";

describe("findSectionFields", () => {
  it("demande les mêmes champs quelles que soient les réponses, dans l'ordre de la page", () => {
    expect(findSectionFields()).toEqual({
      identite: ["civilite", "dateNaissance", "nationalite", "nir", "cleNir"],
      contact: ["telephone"],
    });
  });
});
