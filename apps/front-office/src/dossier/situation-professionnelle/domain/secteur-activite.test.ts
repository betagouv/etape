import { describe, expect, it } from "vitest";

import { findSecteursActivite, formatSecteurActivite } from "./secteur-activite";

const BOULANGERIE = { code: "10.71C", libelle: "Boulangerie et boulangerie-pâtisserie" };
const PATISSERIE = { code: "10.71D", libelle: "Pâtisserie" };
const HYPERMARCHES = { code: "47.11F", libelle: "Hypermarchés" };
const SECTEURS = [BOULANGERIE, PATISSERIE, HYPERMARCHES];

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

describe("formatSecteurActivite", () => {
  it("affiche le libellé suivi du code", () => {
    expect(formatSecteurActivite(BOULANGERIE)).toBe(
      "Boulangerie et boulangerie-pâtisserie (10.71C)",
    );
  });
});
