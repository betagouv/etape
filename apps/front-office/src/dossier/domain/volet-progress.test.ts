import { describe, expect, it } from "vitest";

import {
  computeSectionProgress,
  computeVoletProgress,
  describeVoletStatut,
  listFilledFields,
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

  it("compte l'employeur choisi comme rempli, pas l'absence d'employeur", () => {
    expect(listFilledFields({ employeur: null }, ["employeur"])).toEqual([]);
    expect(listFilledFields({ employeur: { siret: "50393256800010" } }, ["employeur"])).toEqual([
      "employeur",
    ]);
  });
});

describe("computeVoletProgress", () => {
  it("compte les champs demandés, ceux qui sont remplis et ceux qui restent", () => {
    expect(
      computeVoletProgress(
        ["civilite", "dateNaissance", "telephone"],
        ["civilite", "telephone"],
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
      ["intitulePoste", "adresse"],
      ["intitulePoste", "siret"],
      {},
    );

    expect(progress.filledFieldCount).toBe(1);
    expect(progress.remainingFieldCount).toBe(1);
  });

  it("ne compte que les erreurs des champs demandés", () => {
    const errors = {
      cleNir: { message: "x" },
      telephone: { message: "y" },
      root: { message: "z" },
    };

    expect(computeVoletProgress(["cleNir", "civilite"], [], errors).errorCount).toBe(1);
  });
});

describe("computeSectionProgress", () => {
  it("compte les champs de la section qui restent à remplir, et ses erreurs", () => {
    expect(
      computeSectionProgress(
        ["siret", "adresse", "intitulePoste"],
        ["intitulePoste", "employeur"],
        {
          siret: { message: "x" },
          dateDemission: { message: "y" },
        },
      ),
    ).toEqual({ remainingFieldCount: 2, errorCount: 1 });
  });
});

describe("describeVoletStatut", () => {
  const requiredFields: RequiredFields = {
    sectionFields: { identite: ["civilite", "cleNir"], contact: ["telephone"] },
    allFields: ["civilite", "cleNir", "telephone"],
    filledFields: ["civilite", "cleNir"],
  };

  it("annonce les erreurs des champs demandés et les champs qui restent", () => {
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
});
