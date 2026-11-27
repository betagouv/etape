import { describe, expect, it } from "vitest";

import {
  canAddDemarche,
  canCancelDemarche,
  createDemarche,
  DEMARCHE_FIELDS,
  EMPTY_CURRENT_DEMARCHE,
  findDemarcheFields,
  findDemarcheIntitule,
  findOpenDemarcheFields,
  formatCancelAnnouncement,
  formatEditCancelAnnouncement,
  formatDemarcheAnnouncement,
  formatDemarcheLabel,
  formatEditAnnouncement,
  formatEditLabel,
  formatRemovalAnnouncement,
  formatRemovalMessage,
  formatAllRemovedAnnouncement,
  formatRemovalTitle,
  formatRemoveLabel,
  isDemarcheFilled,
  isDemarcheStarted,
  isPrecisionRequired,
  MAX_DEMARCHES_MESSAGE,
  NOMBRE_MAX_DEMARCHES,
  removeDemarche,
  replaceDemarche,
  TYPE_DEMARCHE_AUTRE,
  type CurrentDemarche,
  type Demarche,
} from "./demarche";
import { OUI_NON } from "./oui-non";

/** La liste des types d'un volet, réduite à ce que les règles distinguent. */
const TYPE_DEMARCHE = {
  IMMERSION: "immersion",
  SALON: "salon",
  AUTRE: TYPE_DEMARCHE_AUTRE,
} as const;

type TypeDemarche = (typeof TYPE_DEMARCHE)[keyof typeof TYPE_DEMARCHE];

const TYPE_DEMARCHE_LABEL: Record<TypeDemarche, string> = {
  [TYPE_DEMARCHE.IMMERSION]: "Immersion en entreprise",
  [TYPE_DEMARCHE.SALON]: "Salon, forum ou job dating",
  [TYPE_DEMARCHE.AUTRE]: "Autre",
};

/** Une saisie complète pour un type de la liste. */
const IMMERSION: CurrentDemarche<TypeDemarche> = {
  typeDemarche: TYPE_DEMARCHE.IMMERSION,
  precisionTypeDemarche: "",
  apportDemarche: "J’ai vérifié que je tenais ce rythme.",
  piecesJustificatives: [],
};

describe("isPrecisionRequired", () => {
  it("est vrai pour « Autre »", () => {
    expect(isPrecisionRequired(TYPE_DEMARCHE.AUTRE)).toBe(true);
  });

  it("est faux pour un type de la liste, et tant qu'aucun type n'est choisi", () => {
    expect(isPrecisionRequired(TYPE_DEMARCHE.SALON)).toBe(false);
    expect(isPrecisionRequired(undefined)).toBe(false);
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

describe("findOpenDemarcheFields", () => {
  /** La carte de saisie est ouverte, aucun type n'est choisi. */
  const OPEN = { hasCurrentDemarche: true };

  it("n'exige rien tant que la question n'a pas de réponse", () => {
    expect(findOpenDemarcheFields(undefined, OPEN)).toEqual([]);
  });

  it("n'exige rien après un « non », même si un type reste saisi", () => {
    expect(
      findOpenDemarcheFields(OUI_NON.NON, { ...OPEN, typeDemarche: TYPE_DEMARCHE.AUTRE }),
    ).toEqual([]);
  });

  it("exige le type et l'apport après un « oui », carte de saisie ouverte", () => {
    expect(findOpenDemarcheFields(OUI_NON.OUI, OPEN)).toEqual(["typeDemarche", "apportDemarche"]);
  });

  it("exige aussi la précision pour « Autre »", () => {
    expect(
      findOpenDemarcheFields(OUI_NON.OUI, { ...OPEN, typeDemarche: TYPE_DEMARCHE.AUTRE }),
    ).toEqual(DEMARCHE_FIELDS);
  });

  it("n'exige plus rien une fois la carte de saisie fermée", () => {
    expect(findOpenDemarcheFields(OUI_NON.OUI, { hasCurrentDemarche: false })).toEqual([]);
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
      findDemarcheIntitule(
        { typeDemarche: TYPE_DEMARCHE.SALON, precisionTypeDemarche: "" },
        TYPE_DEMARCHE_LABEL,
      ),
    ).toBe("Salon, forum ou job dating");
  });

  it("nomme une démarche « Autre » par sa précision (maquette 12)", () => {
    expect(
      findDemarcheIntitule(
        { typeDemarche: TYPE_DEMARCHE.AUTRE, precisionTypeDemarche: "Stage chez un artisan" },
        TYPE_DEMARCHE_LABEL,
      ),
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

describe("isDemarcheStarted", () => {
  it("est faux pour une saisie vide, espaces compris", () => {
    expect(isDemarcheStarted(EMPTY_CURRENT_DEMARCHE)).toBe(false);
    expect(isDemarcheStarted({ ...EMPTY_CURRENT_DEMARCHE, apportDemarche: "  " })).toBe(false);
  });

  it("est vrai dès qu'un champ est rempli ou qu'un justificatif est déposé", () => {
    const piece = { id: "p", fichier: new File([], "attestation.pdf"), dateDepot: new Date(0) };

    expect(
      isDemarcheStarted({ ...EMPTY_CURRENT_DEMARCHE, typeDemarche: TYPE_DEMARCHE.SALON }),
    ).toBe(true);
    expect(isDemarcheStarted({ ...EMPTY_CURRENT_DEMARCHE, apportDemarche: "Un début." })).toBe(
      true,
    );
    expect(isDemarcheStarted({ ...EMPTY_CURRENT_DEMARCHE, piecesJustificatives: [piece] })).toBe(
      true,
    );
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
  it("accepte une démarche de plus jusqu'à vingt", () => {
    expect(NOMBRE_MAX_DEMARCHES).toBe(20);
    expect(canAddDemarche(19)).toBe(true);
    expect(canAddDemarche(20)).toBe(false);
    expect(MAX_DEMARCHES_MESSAGE).toBe("Vous pouvez déclarer 20 démarches au maximum.");
  });
});

describe("canCancelDemarche", () => {
  it("laisse annuler une saisie dès qu'une démarche est validée, pas la première", () => {
    expect(canCancelDemarche(0)).toBe(false);
    expect(canCancelDemarche(1)).toBe(true);
  });
});

describe("EMPTY_CURRENT_DEMARCHE", () => {
  it("est une saisie sans type, que le bouton de validation tient pour incomplète", () => {
    expect(EMPTY_CURRENT_DEMARCHE.typeDemarche).toBeUndefined();
    expect(isDemarcheFilled(EMPTY_CURRENT_DEMARCHE)).toBe(false);
  });
});

describe("formatDemarcheAnnouncement", () => {
  it("annonce la démarche validée par son rang", () => {
    expect(formatDemarcheAnnouncement(1)).toBe("Démarche 2 enregistrée.");
  });
});

describe("formatCancelAnnouncement", () => {
  it("annonce la saisie abandonnée par le rang qu'aurait eu la démarche", () => {
    expect(formatCancelAnnouncement(1)).toBe("Saisie de la démarche 2 annulée.");
  });
});

describe("replaceDemarche", () => {
  const salon: Demarche<TypeDemarche> = {
    id: "a",
    typeDemarche: TYPE_DEMARCHE.SALON,
    precisionTypeDemarche: "",
    apportDemarche: "J’ai rencontré trois artisans.",
    piecesJustificatives: [],
  };
  const immersion: Demarche<TypeDemarche> = {
    ...salon,
    id: "b",
    typeDemarche: TYPE_DEMARCHE.IMMERSION,
  };

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
    expect(formatEditLabel(0)).toBe("Modifier la démarche 1");
    expect(formatEditAnnouncement(0)).toBe("Démarche 1 modifiée.");
    expect(formatEditCancelAnnouncement(2)).toBe("Modification de la démarche 3 annulée.");
  });
});

describe("suppression d'une démarche", () => {
  const salon: Demarche<TypeDemarche> = {
    id: "a",
    typeDemarche: TYPE_DEMARCHE.SALON,
    precisionTypeDemarche: "",
    apportDemarche: "J’ai rencontré trois artisans.",
    piecesJustificatives: [],
  };
  const immersion: Demarche<TypeDemarche> = {
    ...salon,
    id: "b",
    typeDemarche: TYPE_DEMARCHE.IMMERSION,
  };

  it("retire la démarche de cet `id` et garde les autres dans l'ordre", () => {
    expect(removeDemarche([salon, immersion], "a")).toEqual([immersion]);
    expect(removeDemarche([salon, immersion], "inconnu")).toEqual([salon, immersion]);
  });

  it("nomme la corbeille et annonce la suppression par le rang de la démarche", () => {
    expect(formatRemoveLabel(1)).toBe("Supprimer la démarche 2");
    expect(formatRemovalAnnouncement(1)).toBe("Démarche 2 supprimée.");
  });

  it("parle d'une démarche dans la fenêtre ouverte par la corbeille", () => {
    expect(formatRemovalTitle(1)).toBe("Supprimer votre démarche");
    expect(formatRemovalMessage(1, false)).toBe(
      "En cliquant sur «\u00a0Supprimer\u00a0», la démarche suivante et ses justificatifs seront supprimés de votre dossier, y compris dans «\u00a0Mes documents\u00a0».",
    );
  });

  it("parle de toutes les démarches dans la fenêtre ouverte par un « non »", () => {
    expect(formatRemovalTitle(3)).toBe("Supprimer vos démarches");
    expect(formatRemovalMessage(3, false)).toContain(
      "les démarches suivantes et leurs justificatifs",
    );
    expect(formatAllRemovedAnnouncement(3)).toBe("Vos démarches ont été supprimées.");
    expect(formatAllRemovedAnnouncement(1)).toBe("Votre démarche a été supprimée.");
  });

  it("ajoute la saisie commencée au message quand un « non » l'emporte aussi", () => {
    const sentence = "La démarche en cours de saisie et ses justificatifs seront aussi supprimés.";

    expect(formatRemovalMessage(2, true)).toBe(`${formatRemovalMessage(2, false)} ${sentence}`);
    expect(formatRemovalMessage(2, false)).not.toContain(sentence);
  });
});
