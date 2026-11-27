import { describe, expect, it } from "vitest";

import { ENTRY_MODE } from "../../domain/entry-mode";
import { findSectionFields, findSectionValidatedFields } from "./section-fields";

/** Les champs exigés après le diplôme, dans l'ordre de la page. */
const FORMATION_FIELDS = [
  "dureeFormation",
  "heuresParSemaine",
  "dateDebutFormation",
  "dateFinFormation",
  "modalitesFormation",
  "contenuFormation",
];

describe("findSectionFields", () => {
  it("exige 8 champs en recherche, dont le diplôme choisi", () => {
    expect(findSectionFields({ certificationViseeEntryMode: ENTRY_MODE.SEARCH })).toEqual({
      formation: ["intituleFormation", "certificationVisee", ...FORMATION_FIELDS],
    });
  });

  it("exige 8 champs en saisie manuelle, dont l'intitulé du diplôme seul", () => {
    expect(findSectionFields({ certificationViseeEntryMode: ENTRY_MODE.MANUAL })).toEqual({
      formation: ["intituleFormation", "intituleCertificationVisee", ...FORMATION_FIELDS],
    });
  });
});

describe("findSectionValidatedFields", () => {
  it("contrôle aussi le code RNCP en saisie manuelle", () => {
    expect(findSectionValidatedFields({ certificationViseeEntryMode: ENTRY_MODE.MANUAL })).toEqual({
      formation: [
        "intituleFormation",
        "intituleCertificationVisee",
        "numeroFiche",
        ...FORMATION_FIELDS,
      ],
    });
  });

  it("se confond avec les champs exigés en recherche", () => {
    const answers = { certificationViseeEntryMode: ENTRY_MODE.SEARCH };
    expect(findSectionValidatedFields(answers)).toEqual(findSectionFields(answers));
  });
});
