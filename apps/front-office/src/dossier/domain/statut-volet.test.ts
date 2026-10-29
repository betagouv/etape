import { describe, expect, it } from "vitest";

import {
  getStatutVolet,
  isVoletCompleted,
  listStatutVoletLines,
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
