import { describe, expect, it } from "vitest";

import {
  buildRequiredFields,
  computeSectionProgress,
  computeVoletProgress,
  describeVoletStatut,
  listFilledFields,
  listValidatedFields,
  type RequiredFields,
} from "./volet-progress";

describe("listFilledFields", () => {
  it("ne garde que les champs demandés qui ont une valeur", () => {
    // Comme dans un formulaire : les valeurs portent aussi des champs qui ne sont pas demandés.
    const values = { civilite: "madame", dateNaissance: "", telephone: "06 12 34 56 78" };

    expect(listFilledFields(values, ["civilite", "dateNaissance", "nationalite"])).toEqual([
      "civilite",
    ]);
  });

  it("ne compte pas comme remplie une saisie faite seulement d'espaces", () => {
    expect(
      listFilledFields({ denomination: "   ", siret: " 1 " }, ["denomination", "siret"]),
    ).toEqual(["siret"]);
  });

  it("compte l'employeur choisi comme rempli, pas l'absence d'employeur", () => {
    expect(listFilledFields({ employeur: null }, ["employeur"])).toEqual([]);
    expect(listFilledFields({ employeur: { siret: "50393256800010" } }, ["employeur"])).toEqual([
      "employeur",
    ]);
  });
});

/** Un volet sans champ facultatif contrôlé : ses champs contrôlés sont ses champs demandés. */
function createRequiredFields(
  sectionFields: Record<string, readonly string[]>,
  filledFields: readonly string[],
): RequiredFields {
  return {
    sectionFields,
    allFields: Object.values(sectionFields).flat(),
    filledFields,
    sectionValidatedFields: sectionFields,
  };
}

/** En saisie manuelle du métier visé : l'intitulé est demandé, le code ROME seulement contrôlé. */
const MANUAL_METIER_VISE: RequiredFields = {
  sectionFields: { "metier-vise": ["intituleMetierVise"] },
  allFields: ["intituleMetierVise"],
  filledFields: ["intituleMetierVise"],
  sectionValidatedFields: { "metier-vise": ["intituleMetierVise", "codeRome"] },
};

describe("buildRequiredFields", () => {
  const SECTION_FIELDS = {
    emploi: ["employeur", "intitulePoste"],
    demission: ["demission", "dateDemission"],
  } as const;

  it("réunit les champs des sections, dans l'ordre de la page, et relève ceux qui sont remplis", () => {
    const required = buildRequiredFields(
      { employeur: null, intitulePoste: "Comptable", demission: "oui", dateDemission: " " },
      SECTION_FIELDS,
    );

    expect(required.sectionFields).toBe(SECTION_FIELDS);
    expect(required.allFields).toEqual([
      "employeur",
      "intitulePoste",
      "demission",
      "dateDemission",
    ]);
    expect(required.filledFields).toEqual(["intitulePoste", "demission"]);
  });

  it("contrôle les champs demandés quand aucun champ facultatif n'est contrôlé", () => {
    expect(buildRequiredFields({}, SECTION_FIELDS).sectionValidatedFields).toBe(SECTION_FIELDS);
  });

  it("garde à part les champs contrôlés quand un champ facultatif l'est", () => {
    const sectionFields = { "metier-vise": ["intituleMetierVise"] } as const;
    const sectionValidatedFields = { "metier-vise": ["intituleMetierVise", "codeRome"] } as const;

    const required = buildRequiredFields(
      { intituleMetierVise: "Boulanger", codeRome: "D1102" },
      sectionFields,
      sectionValidatedFields,
    );

    // Le code ROME, facultatif, n'est ni demandé ni compté parmi les champs remplis.
    expect(required.allFields).toEqual(["intituleMetierVise"]);
    expect(required.filledFields).toEqual(["intituleMetierVise"]);
    expect(required.sectionValidatedFields).toBe(sectionValidatedFields);
  });
});

describe("listValidatedFields", () => {
  it("liste les champs contrôlés de toutes les sections, dans l'ordre de la page", () => {
    expect(
      listValidatedFields({
        ...MANUAL_METIER_VISE,
        sectionValidatedFields: { emploi: ["siret", "adresse"], demission: ["demission"] },
      }),
    ).toEqual(["siret", "adresse", "demission"]);
  });
});

describe("computeVoletProgress", () => {
  it("compte les champs demandés, ceux qui sont remplis et ceux qui restent", () => {
    expect(
      computeVoletProgress(
        createRequiredFields({ identite: ["civilite", "dateNaissance"], contact: ["telephone"] }, [
          "civilite",
          "telephone",
        ]),
        {},
      ),
    ).toEqual({
      requiredFieldCount: 3,
      filledFieldCount: 2,
      remainingFieldCount: 1,
      errorCount: 0,
    });
  });

  it("ne compte pas un champ rempli qui n'est pas demandé", () => {
    const progress = computeVoletProgress(
      createRequiredFields({ emploi: ["intitulePoste", "adresse"] }, ["intitulePoste", "siret"]),
      {},
    );

    expect(progress.filledFieldCount).toBe(1);
    expect(progress.remainingFieldCount).toBe(1);
  });

  it("ne compte que les erreurs des champs contrôlés", () => {
    const errors = {
      cleNir: { message: "x" },
      telephone: { message: "y" },
      root: { message: "z" },
    };

    expect(
      computeVoletProgress(createRequiredFields({ identite: ["cleNir", "civilite"] }, []), errors)
        .errorCount,
    ).toBe(1);
  });

  it("compte l'erreur d'un champ facultatif, sans le compter parmi les champs demandés", () => {
    expect(computeVoletProgress(MANUAL_METIER_VISE, { codeRome: { message: "x" } })).toEqual({
      requiredFieldCount: 1,
      filledFieldCount: 1,
      remainingFieldCount: 0,
      errorCount: 1,
    });
  });
});

describe("computeSectionProgress", () => {
  it("compte les champs de la section qui restent à remplir, et ses erreurs", () => {
    const requiredFields = createRequiredFields(
      { emploi: ["siret", "adresse", "intitulePoste"], demission: ["demission"] },
      ["intitulePoste", "employeur"],
    );

    expect(
      computeSectionProgress(requiredFields, "emploi", {
        siret: { message: "x" },
        dateDemission: { message: "y" },
      }),
    ).toEqual({ remainingFieldCount: 2, errorCount: 1 });
  });

  it("compte l'erreur d'un champ facultatif de la section, sans champ restant", () => {
    expect(
      computeSectionProgress(MANUAL_METIER_VISE, "metier-vise", { codeRome: { message: "x" } }),
    ).toEqual({ remainingFieldCount: 0, errorCount: 1 });
  });
});

describe("describeVoletStatut", () => {
  const requiredFields = createRequiredFields(
    { identite: ["civilite", "cleNir"], contact: ["telephone"] },
    ["civilite", "cleNir"],
  );

  it("annonce les erreurs des champs contrôlés et les champs qui restent", () => {
    expect(
      describeVoletStatut("Mes informations", requiredFields, { cleNir: { message: "x" } }),
    ).toBe("Mes informations : 1 erreur à corriger et 1 champ restant.");
  });

  it("annonce un volet complet quand tout est rempli sans erreur", () => {
    expect(
      describeVoletStatut(
        "Mes informations",
        { ...requiredFields, filledFields: requiredFields.allFields },
        {},
      ),
    ).toBe("Mes informations : complet.");
  });

  it("n'annonce pas complet un volet rempli dont un champ facultatif est en erreur", () => {
    expect(
      describeVoletStatut("Mon futur métier", MANUAL_METIER_VISE, { codeRome: { message: "x" } }),
    ).toBe("Mon futur métier : 1 erreur à corriger.");
  });
});
