import { describe, expect, it } from "vitest";

import {
  computeDocumentsObligatoiresProgress,
  computeDocumentsProgress,
  DOCUMENTS_OBLIGATOIRES,
  formatDocumentsStatutChange,
} from "./document-obligatoire";

const PIECE = { id: "programme" };

describe("DOCUMENTS_OBLIGATOIRES", () => {
  it("demande le programme, le calendrier et le devis de la formation, dans cet ordre", () => {
    expect(DOCUMENTS_OBLIGATOIRES.map(({ title }) => title)).toEqual([
      "Programme de la formation",
      "Calendrier de la formation",
      "Devis de la formation",
    ]);
  });
});

describe("computeDocumentsProgress", () => {
  it("compte 3 documents restants dans un dossier neuf", () => {
    expect(
      computeDocumentsProgress({
        programmeFormation: [],
        calendrierFormation: [],
        devisFormation: [],
      }),
    ).toEqual({
      requiredFieldCount: 3,
      filledFieldCount: 0,
      remainingFieldCount: 3,
      errorCount: 0,
    });
  });

  it("compte un document comme déposé dès sa première pièce, quel que soit leur nombre", () => {
    expect(
      computeDocumentsProgress({
        programmeFormation: [PIECE],
        calendrierFormation: [PIECE, PIECE],
        devisFormation: [],
      }),
    ).toMatchObject({ filledFieldCount: 2, remainingFieldCount: 1 });
  });

  it("ne compte plus aucun document restant quand les trois ont une pièce", () => {
    expect(
      computeDocumentsProgress({
        programmeFormation: [PIECE],
        calendrierFormation: [PIECE],
        devisFormation: [PIECE],
      }),
    ).toMatchObject({ remainingFieldCount: 0 });
  });
});

describe("computeDocumentsObligatoiresProgress", () => {
  it("reprend les documents restants du volet", () => {
    expect(
      computeDocumentsObligatoiresProgress({
        requiredFieldCount: 3,
        filledFieldCount: 1,
        remainingFieldCount: 2,
        errorCount: 0,
      }),
    ).toEqual({ remainingFieldCount: 2, errorCount: 0 });
  });
});

describe("formatDocumentsStatutChange", () => {
  const VIDE = { programmeFormation: [], calendrierFormation: [], devisFormation: [] };

  it("annonce les documents restants après le premier dépôt d'un document", () => {
    expect(formatDocumentsStatutChange(VIDE, { ...VIDE, programmeFormation: [PIECE] })).toBe(
      "Mes documents : 2 documents restants à déposer.",
    );
  });

  it("ne dit rien quand un document déjà déposé reçoit une pièce de plus", () => {
    const depose = { ...VIDE, programmeFormation: [PIECE] };
    expect(
      formatDocumentsStatutChange(depose, { ...depose, programmeFormation: [PIECE, PIECE] }),
    ).toBe("");
  });

  it("annonce le volet complet, puis de nouveau à déposer quand on retire la dernière pièce", () => {
    const presque = { ...VIDE, programmeFormation: [PIECE], calendrierFormation: [PIECE] };
    const complet = { ...presque, devisFormation: [PIECE] };
    expect(formatDocumentsStatutChange(presque, complet)).toBe("Mes documents : complet.");
    expect(formatDocumentsStatutChange({ ...VIDE, devisFormation: [PIECE] }, VIDE)).toBe(
      "Mes documents : 3 documents à déposer.",
    );
  });
});
