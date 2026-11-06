import { describe, expect, it } from "vitest";

import {
  findSecteurActiviteByCode,
  findSecteursActivite,
  formatSecteurActivite,
} from "./secteur-activite";

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
