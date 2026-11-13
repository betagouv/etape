import { describe, expect, it } from "vitest";

import { CIVILITE, INFORMATIONS_SECTION, type InformationsFormData } from "../schema";
import { findRequiredFields } from "./required-fields";

const values: InformationsFormData = {
  civilite: CIVILITE.MADAME,
  dateNaissance: "",
  nationalite: "fr",
  nir: "",
  cleNir: "",
  telephone: "06 12 34 56 78",
};

describe("findRequiredFields", () => {
  it("demande les mêmes champs quelles que soient les réponses, dans l'ordre de la page", () => {
    const required = findRequiredFields(values);

    expect(required.sectionFields[INFORMATIONS_SECTION.IDENTITE]).toEqual([
      "civilite",
      "dateNaissance",
      "nationalite",
      "nir",
      "cleNir",
    ]);
    expect(required.sectionFields[INFORMATIONS_SECTION.CONTACT]).toEqual(["telephone"]);
    expect(required.allFields).toEqual([
      "civilite",
      "dateNaissance",
      "nationalite",
      "nir",
      "cleNir",
      "telephone",
    ]);
  });

  it("ne retient comme remplis que les champs qui ont une valeur", () => {
    expect(findRequiredFields(values).filledFields).toEqual([
      "civilite",
      "nationalite",
      "telephone",
    ]);
  });
});
