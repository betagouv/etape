import { describe, expect, it } from "vitest";

import {
  canAddDemarche,
  createDemarche,
  DEMARCHE_FIELDS,
  findDemarcheFields,
  findDemarcheIntitule,
  formatAnnulationAnnouncement,
  formatAnnulationModificationAnnouncement,
  formatDemarcheAnnouncement,
  formatDemarcheLabel,
  formatModificationAnnouncement,
  formatModifierLabel,
  isDemarcheFilled,
  MESSAGE_NOMBRE_MAX_DEMARCHES,
  NOMBRE_MAX_DEMARCHES,
  replaceDemarche,
  TYPE_DEMARCHE,
  TYPE_DEMARCHE_LABEL,
  type CurrentDemarche,
  type Demarche,
} from "./demarche";

/** Une saisie complète pour un type de la liste. */
const IMMERSION: CurrentDemarche = {
  typeDemarche: TYPE_DEMARCHE.IMMERSION,
  precisionTypeDemarche: "",
  apportDemarche: "J’ai vérifié que je tenais ce rythme.",
  piecesJustificatives: [],
};

describe("TYPE_DEMARCHE_LABEL", () => {
  it("propose neuf types, « Autre » en dernier", () => {
    const labels = Object.values(TYPE_DEMARCHE_LABEL);

    expect(labels).toHaveLength(9);
    expect(labels[0]).toBe("Immersion en entreprise (stage d’observation, PMSMP)");
    expect(labels.at(-1)).toBe("Autre");
  });
});

describe("findDemarcheFields", () => {
  it("exige le type et l'apport tant qu'aucun type n'est choisi", () => {
    expect(findDemarcheFields(undefined)).toEqual(["typeDemarche", "apportDemarche"]);
  });

  it("n'exige pas la précision pour un type de la liste", () => {
    expect(findDemarcheFields(TYPE_DEMARCHE.SALON)).toEqual(["typeDemarche", "apportDemarche"]);
  });

  it("exige la précision pour « Autre », entre le type et l'apport comme sur la page", () => {
    expect(findDemarcheFields(TYPE_DEMARCHE.AUTRE)).toEqual(DEMARCHE_FIELDS);
    expect(DEMARCHE_FIELDS).toEqual(["typeDemarche", "precisionTypeDemarche", "apportDemarche"]);
  });
});

describe("formatDemarcheLabel", () => {
  it("numérote les démarches à partir de 1", () => {
    expect(formatDemarcheLabel(0)).toBe("Démarche 1");
    expect(formatDemarcheLabel(4)).toBe("Démarche 5");
  });
});

describe("findDemarcheIntitule", () => {
  it("nomme la démarche par le libellé de son type", () => {
    expect(
      findDemarcheIntitule({ typeDemarche: TYPE_DEMARCHE.SALON, precisionTypeDemarche: "" }),
    ).toBe("Salon, forum ou job dating");
  });

  it("nomme une démarche « Autre » par sa précision (maquette 12)", () => {
    expect(
      findDemarcheIntitule({
        typeDemarche: TYPE_DEMARCHE.AUTRE,
        precisionTypeDemarche: "Stage chez un artisan",
      }),
    ).toBe("Stage chez un artisan");
  });
});

describe("isDemarcheFilled", () => {
  it("attend le type et l'apport", () => {
    expect(isDemarcheFilled(IMMERSION)).toBe(true);
    expect(isDemarcheFilled({ ...IMMERSION, typeDemarche: undefined })).toBe(false);
    expect(isDemarcheFilled({ ...IMMERSION, apportDemarche: "  " })).toBe(false);
  });

  it("attend aussi la précision pour « Autre »", () => {
    const autre = { ...IMMERSION, typeDemarche: TYPE_DEMARCHE.AUTRE };

    expect(isDemarcheFilled(autre)).toBe(false);
    expect(isDemarcheFilled({ ...autre, precisionTypeDemarche: "Stage" })).toBe(true);
  });
});

describe("createDemarche", () => {
  it("reprend la saisie, espaces autour retirés", () => {
    expect(
      createDemarche("a", { ...IMMERSION, apportDemarche: "  Appris le pétrissage. " }),
    ).toEqual({
      id: "a",
      typeDemarche: TYPE_DEMARCHE.IMMERSION,
      precisionTypeDemarche: "",
      apportDemarche: "Appris le pétrissage.",
      piecesJustificatives: [],
    });
  });

  it("ne garde la précision que pour « Autre »", () => {
    const precision = { precisionTypeDemarche: " Stage chez un artisan " };

    expect(createDemarche("a", { ...IMMERSION, ...precision })?.precisionTypeDemarche).toBe("");
    expect(
      createDemarche("a", { ...IMMERSION, ...precision, typeDemarche: TYPE_DEMARCHE.AUTRE })
        ?.precisionTypeDemarche,
    ).toBe("Stage chez un artisan");
  });

  it("ne rend rien tant qu'aucun type n'est choisi", () => {
    expect(createDemarche("a", { ...IMMERSION, typeDemarche: undefined })).toBeUndefined();
  });
});

describe("canAddDemarche", () => {
  it("accepte une démarche de plus jusqu'à cinq", () => {
    expect(NOMBRE_MAX_DEMARCHES).toBe(5);
    expect(canAddDemarche(4)).toBe(true);
    expect(canAddDemarche(5)).toBe(false);
    expect(MESSAGE_NOMBRE_MAX_DEMARCHES).toBe("Vous pouvez déclarer 5 démarches au maximum.");
  });
});

describe("formatDemarcheAnnouncement", () => {
  it("annonce la démarche validée par son rang", () => {
    expect(formatDemarcheAnnouncement(1)).toBe("Démarche 2 enregistrée.");
  });
});

describe("formatAnnulationAnnouncement", () => {
  it("annonce la saisie abandonnée par le rang qu'aurait eu la démarche", () => {
    expect(formatAnnulationAnnouncement(1)).toBe("Saisie de la démarche 2 annulée.");
  });
});

describe("replaceDemarche", () => {
  const salon: Demarche = {
    id: "a",
    typeDemarche: TYPE_DEMARCHE.SALON,
    precisionTypeDemarche: "",
    apportDemarche: "J’ai rencontré trois artisans.",
    piecesJustificatives: [],
  };
  const immersion: Demarche = { ...salon, id: "b", typeDemarche: TYPE_DEMARCHE.IMMERSION };

  it("remplace la démarche de même `id`, à sa place", () => {
    const modifiee = { ...salon, apportDemarche: "J’en ai rencontré cinq." };

    expect(replaceDemarche([salon, immersion], modifiee)).toEqual([modifiee, immersion]);
  });

  it("ne touche à rien quand aucune démarche ne porte cet `id`", () => {
    expect(replaceDemarche([salon], immersion)).toEqual([salon]);
  });
});

describe("modification d'une démarche", () => {
  it("nomme le bouton et annonce la modification par le rang de la démarche", () => {
    expect(formatModifierLabel(0)).toBe("Modifier la démarche 1");
    expect(formatModificationAnnouncement(0)).toBe("Démarche 1 modifiée.");
    expect(formatAnnulationModificationAnnouncement(2)).toBe(
      "Modification de la démarche 3 annulée.",
    );
  });
});
