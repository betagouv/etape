import { describe, expect, it } from "vitest";

import {
  findSecteurActiviteByCode,
  findSecteurBlurOutcome,
  findSecteursActivite,
  formatSecteurActivite,
  SECTEUR_BLUR_OUTCOME,
} from "./secteur-activite";

const BOULANGERIE = { code: "10.71C", libelle: "Boulangerie et boulangerie-pâtisserie" };
const PATISSERIE = { code: "10.71D", libelle: "Pâtisserie" };
const HYPERMARCHES = { code: "47.11F", libelle: "Hypermarchés" };
const GROS_OEUVRE = {
  code: "43.99C",
  libelle: "Travaux de maçonnerie générale et gros œuvre de bâtiment",
};
const AGRUMES = { code: "46.31Z", libelle: "Commerce de gros de fruits et légumes, d'agrumes" };
const SECTEURS = [BOULANGERIE, PATISSERIE, HYPERMARCHES, GROS_OEUVRE, AGRUMES];

describe("findSecteursActivite", () => {
  it("trouve un code APE écrit sans point, comme sur le bulletin de salaire", () => {
    expect(findSecteursActivite(SECTEURS, "1071C")).toEqual([BOULANGERIE]);
  });

  it("trouve le début d'un code", () => {
    expect(findSecteursActivite(SECTEURS, "10.71")).toEqual([BOULANGERIE, PATISSERIE]);
  });

  it("trouve un mot-clé sans tenir compte des accents ni de la casse", () => {
    expect(findSecteursActivite(SECTEURS, "patisserie")).toEqual([BOULANGERIE, PATISSERIE]);
  });

  it("ne renvoie rien pour une saisie vide", () => {
    expect(findSecteursActivite(SECTEURS, "  ")).toEqual([]);
  });
});

describe("findSecteursActivite — ligatures et apostrophe", () => {
  it("trouve « gros œuvre » avec « gros oeuvre »", () => {
    expect(findSecteursActivite(SECTEURS, "gros oeuvre")).toEqual([GROS_OEUVRE]);
  });

  it("trouve « d'agrumes » avec l'apostrophe typographique « d’agrumes »", () => {
    expect(findSecteursActivite(SECTEURS, "d’agrumes")).toEqual([AGRUMES]);
  });
});

describe("findSecteurActiviteByCode", () => {
  it("trouve le secteur d'un code complet, écrit comme sur le bulletin de salaire", () => {
    expect(findSecteurActiviteByCode(SECTEURS, "1071c")).toBe(BOULANGERIE);
  });

  it("ne retient ni un début de code ni un mot-clé", () => {
    expect(findSecteurActiviteByCode(SECTEURS, "10.71")).toBeUndefined();
    expect(findSecteurActiviteByCode(SECTEURS, "Pâtisserie")).toBeUndefined();
    expect(findSecteurActiviteByCode(SECTEURS, " ")).toBeUndefined();
  });
});

describe("formatSecteurActivite", () => {
  it("affiche le libellé suivi du code", () => {
    expect(formatSecteurActivite(BOULANGERIE)).toBe(
      "Boulangerie et boulangerie-pâtisserie (10.71C)",
    );
  });
});

describe("findSecteurBlurOutcome", () => {
  it("réaffiche le secteur choisi sans saisie en cours", () => {
    expect(findSecteurBlurOutcome(SECTEURS, null, true)).toEqual({
      outcome: SECTEUR_BLUR_OUTCOME.RESTORE,
    });
  });

  it("réaffiche le secteur choisi quand le texte modifié ne désigne aucun code", () => {
    expect(
      findSecteurBlurOutcome(SECTEURS, "Boulangerie et boulangerie-pâtisserie (10.71", true),
    ).toEqual({ outcome: SECTEUR_BLUR_OUTCOME.RESTORE });
    expect(findSecteurBlurOutcome(SECTEURS, "pati", true)).toEqual({
      outcome: SECTEUR_BLUR_OUTCOME.RESTORE,
    });
  });

  it("garde le texte tapé quand aucun secteur n'est choisi", () => {
    expect(findSecteurBlurOutcome(SECTEURS, "boul", false)).toEqual({
      outcome: SECTEUR_BLUR_OUTCOME.KEEP_TEXT,
    });
  });

  it("sélectionne le secteur dont le code complet a été tapé", () => {
    expect(findSecteurBlurOutcome(SECTEURS, "10.71c", false)).toEqual({
      outcome: SECTEUR_BLUR_OUTCOME.SELECT,
      secteur: BOULANGERIE,
    });
  });

  it("retire le secteur quand le champ a été vidé", () => {
    expect(findSecteurBlurOutcome(SECTEURS, "", true)).toEqual({
      outcome: SECTEUR_BLUR_OUTCOME.CLEAR,
    });
    expect(findSecteurBlurOutcome(SECTEURS, "  ", true)).toEqual({
      outcome: SECTEUR_BLUR_OUTCOME.CLEAR,
    });
  });
});
