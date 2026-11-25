import { describe, expect, it } from "vitest";

import {
  formatStatutVoletAnnouncement,
  formatStatutVoletChange,
  getStatutVolet,
  isVoletCompleted,
  listStatutVoletLines,
  PROGRESS_UNIT,
  STATUT_VOLET,
  type VoletProgress,
} from "./statut-volet";

const A_REMPLIR: VoletProgress = {
  requiredFieldCount: 5,
  filledFieldCount: 0,
  remainingFieldCount: 5,
  errorCount: 0,
};

describe("getStatutVolet", () => {
  it("est à remplir tant qu'aucun champ n'est rempli", () => {
    expect(getStatutVolet(A_REMPLIR)).toBe(STATUT_VOLET.A_REMPLIR);
  });

  it("est en cours dès qu'un champ est rempli et qu'un champ obligatoire reste vide", () => {
    expect(getStatutVolet({ ...A_REMPLIR, filledFieldCount: 1, remainingFieldCount: 4 })).toBe(
      STATUT_VOLET.EN_COURS,
    );
  });

  it("est à corriger dès qu'un champ est en erreur, même sans champ restant", () => {
    expect(
      getStatutVolet({ ...A_REMPLIR, filledFieldCount: 5, remainingFieldCount: 0, errorCount: 1 }),
    ).toBe(STATUT_VOLET.A_CORRIGER);
  });

  it("est complet quand plus aucun champ obligatoire ne reste et qu'aucun n'est en erreur", () => {
    expect(getStatutVolet({ ...A_REMPLIR, filledFieldCount: 5, remainingFieldCount: 0 })).toBe(
      STATUT_VOLET.COMPLET,
    );
  });

  it("est facultatif sans champ obligatoire, vide ou rempli", () => {
    const facultatif = { ...A_REMPLIR, requiredFieldCount: 0, remainingFieldCount: 0 };

    expect(getStatutVolet(facultatif)).toBe(STATUT_VOLET.FACULTATIF);
    expect(getStatutVolet({ ...facultatif, filledFieldCount: 3 })).toBe(STATUT_VOLET.FACULTATIF);
  });

  it("est à corriger quand un champ facultatif est en erreur", () => {
    expect(
      getStatutVolet({
        requiredFieldCount: 0,
        filledFieldCount: 1,
        remainingFieldCount: 0,
        errorCount: 1,
      }),
    ).toBe(STATUT_VOLET.A_CORRIGER);
  });
});

describe("isVoletCompleted", () => {
  it("compte les volets complets et facultatifs", () => {
    expect(isVoletCompleted({ ...A_REMPLIR, filledFieldCount: 5, remainingFieldCount: 0 })).toBe(
      true,
    );
    expect(isVoletCompleted({ ...A_REMPLIR, requiredFieldCount: 0, remainingFieldCount: 0 })).toBe(
      true,
    );
  });

  it("ne compte pas un volet à remplir", () => {
    expect(isVoletCompleted(A_REMPLIR)).toBe(false);
  });
});

describe("listStatutVoletLines", () => {
  it("nomme les volets à remplir, complets et facultatifs sans compteur", () => {
    expect(listStatutVoletLines(A_REMPLIR)).toEqual([
      { statut: STATUT_VOLET.A_REMPLIR, label: "À remplir" },
    ]);
    expect(
      listStatutVoletLines({ ...A_REMPLIR, filledFieldCount: 5, remainingFieldCount: 0 }),
    ).toEqual([{ statut: STATUT_VOLET.COMPLET, label: "Complet" }]);
    expect(
      listStatutVoletLines({ ...A_REMPLIR, requiredFieldCount: 0, remainingFieldCount: 0 }),
    ).toEqual([{ statut: STATUT_VOLET.FACULTATIF, label: "Facultatif" }]);
  });

  it("accorde le compteur d'un volet en cours", () => {
    expect(
      listStatutVoletLines({ ...A_REMPLIR, filledFieldCount: 4, remainingFieldCount: 1 }),
    ).toEqual([{ statut: STATUT_VOLET.EN_COURS, label: "1 champ restant" }]);
    expect(
      listStatutVoletLines({
        requiredFieldCount: 12,
        filledFieldCount: 2,
        remainingFieldCount: 10,
        errorCount: 0,
      }),
    ).toEqual([{ statut: STATUT_VOLET.EN_COURS, label: "10 champs restants" }]);
  });

  it("ajoute les champs restants sous les erreurs à corriger", () => {
    expect(
      listStatutVoletLines({
        ...A_REMPLIR,
        filledFieldCount: 3,
        remainingFieldCount: 2,
        errorCount: 1,
      }),
    ).toEqual([
      { statut: STATUT_VOLET.A_CORRIGER, label: "1 erreur à corriger" },
      { statut: STATUT_VOLET.EN_COURS, label: "2 champs restants" },
    ]);
  });

  it("n'affiche que les erreurs quand aucun champ obligatoire ne reste", () => {
    expect(
      listStatutVoletLines({
        ...A_REMPLIR,
        filledFieldCount: 5,
        remainingFieldCount: 0,
        errorCount: 3,
      }),
    ).toEqual([{ statut: STATUT_VOLET.A_CORRIGER, label: "3 erreurs à corriger" }]);
  });
});

describe("listStatutVoletLines en documents", () => {
  const DOCUMENTS = {
    requiredFieldCount: 3,
    filledFieldCount: 0,
    remainingFieldCount: 3,
    errorCount: 0,
  };

  it("compte les documents à déposer tant qu'aucun n'est déposé", () => {
    expect(listStatutVoletLines(DOCUMENTS, PROGRESS_UNIT.DOCUMENT)).toEqual([
      { statut: STATUT_VOLET.A_REMPLIR, label: "3 documents à déposer" },
    ]);
  });

  it("compte les documents restants à déposer, accordés", () => {
    expect(
      listStatutVoletLines(
        { ...DOCUMENTS, filledFieldCount: 1, remainingFieldCount: 2 },
        PROGRESS_UNIT.DOCUMENT,
      ),
    ).toEqual([{ statut: STATUT_VOLET.EN_COURS, label: "2 documents restants à déposer" }]);
    expect(
      listStatutVoletLines(
        { ...DOCUMENTS, filledFieldCount: 2, remainingFieldCount: 1 },
        PROGRESS_UNIT.DOCUMENT,
      ),
    ).toEqual([{ statut: STATUT_VOLET.EN_COURS, label: "1 document restant à déposer" }]);
  });

  it("dit « Complet » quand les documents obligatoires ont tous une pièce", () => {
    expect(
      listStatutVoletLines(
        { ...DOCUMENTS, filledFieldCount: 3, remainingFieldCount: 0 },
        PROGRESS_UNIT.DOCUMENT,
      ),
    ).toEqual([{ statut: STATUT_VOLET.COMPLET, label: "Complet" }]);
  });

  it("annonce les documents à déposer", () => {
    expect(formatStatutVoletAnnouncement("Mes documents", DOCUMENTS, PROGRESS_UNIT.DOCUMENT)).toBe(
      "Mes documents : 3 documents à déposer.",
    );
  });
});

describe("formatStatutVoletAnnouncement", () => {
  it("annonce le statut en une phrase, précédé du nom du volet", () => {
    expect(formatStatutVoletAnnouncement("Mes informations", A_REMPLIR)).toBe(
      "Mes informations : à remplir.",
    );
    expect(
      formatStatutVoletAnnouncement("Mes informations", {
        ...A_REMPLIR,
        filledFieldCount: 4,
        remainingFieldCount: 1,
      }),
    ).toBe("Mes informations : 1 champ restant.");
    expect(
      formatStatutVoletAnnouncement("Mes informations", {
        ...A_REMPLIR,
        filledFieldCount: 5,
        remainingFieldCount: 0,
      }),
    ).toBe("Mes informations : complet.");
  });

  it("réunit erreurs et champs restants", () => {
    expect(
      formatStatutVoletAnnouncement("Mes informations", {
        ...A_REMPLIR,
        filledFieldCount: 3,
        remainingFieldCount: 2,
        errorCount: 1,
      }),
    ).toBe("Mes informations : 1 erreur à corriger et 2 champs restants.");
    expect(
      formatStatutVoletAnnouncement("Mes informations", {
        ...A_REMPLIR,
        filledFieldCount: 5,
        remainingFieldCount: 0,
        errorCount: 3,
      }),
    ).toBe("Mes informations : 3 erreurs à corriger.");
  });
});

describe("formatStatutVoletChange", () => {
  const EN_COURS: VoletProgress = { ...A_REMPLIR, filledFieldCount: 1, remainingFieldCount: 4 };

  it("annonce le statut quand rien n'a encore été annoncé", () => {
    expect(formatStatutVoletChange("Mes informations", undefined, A_REMPLIR)).toBe(
      "Mes informations : à remplir.",
    );
  });

  it("annonce le nouveau statut quand il change", () => {
    expect(formatStatutVoletChange("Mes informations", A_REMPLIR, EN_COURS)).toBe(
      "Mes informations : 4 champs restants.",
    );
  });

  it("ne dit rien quand le statut annoncé reste le même", () => {
    expect(
      formatStatutVoletChange("Mes informations", EN_COURS, { ...EN_COURS, filledFieldCount: 2 }),
    ).toBe("");
  });

  it("compte en documents pour « Mes documents »", () => {
    const AUCUN: VoletProgress = { ...A_REMPLIR, requiredFieldCount: 3, remainingFieldCount: 3 };
    expect(
      formatStatutVoletChange(
        "Mes documents",
        AUCUN,
        { ...AUCUN, filledFieldCount: 1, remainingFieldCount: 2 },
        PROGRESS_UNIT.DOCUMENT,
      ),
    ).toBe("Mes documents : 2 documents restants à déposer.");
  });
});
