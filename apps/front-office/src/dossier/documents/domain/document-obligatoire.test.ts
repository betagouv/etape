import { describe, expect, it } from "vitest";

import { DOCUMENTS_SECTION } from "../schema";
import {
  DOCUMENTS_OBLIGATOIRES,
  findDocumentsRequiredFields,
  formatDocumentsStatutChange,
} from "./document-obligatoire";

const PIECE = { id: "programme" };

const VIDE = { programmeFormation: [], calendrierFormation: [], devisFormation: [] };

describe("DOCUMENTS_OBLIGATOIRES", () => {
  it("demande le programme, le calendrier et le devis de la formation, dans cet ordre", () => {
    expect(DOCUMENTS_OBLIGATOIRES.map(({ title }) => title)).toEqual([
      "Programme de la formation",
      "Calendrier de la formation",
      "Devis de la formation",
    ]);
  });
});

describe("findDocumentsRequiredFields", () => {
  it("demande les trois documents dans la section des documents obligatoires", () => {
    expect(findDocumentsRequiredFields(VIDE)).toMatchObject({
      sectionFields: {
        [DOCUMENTS_SECTION.OBLIGATOIRES]: [
          "programmeFormation",
          "calendrierFormation",
          "devisFormation",
        ],
      },
      filledFields: [],
    });
  });

  it("compte un document comme déposé dès sa première pièce, quel que soit leur nombre", () => {
    expect(
      findDocumentsRequiredFields({
        programmeFormation: [PIECE],
        calendrierFormation: [PIECE, PIECE],
        devisFormation: [],
      }).filledFields,
    ).toEqual(["programmeFormation", "calendrierFormation"]);
  });
});

describe("formatDocumentsStatutChange", () => {
  it("annonce les documents restants après le premier dépôt d'un document", () => {
    expect(formatDocumentsStatutChange(VIDE, { ...VIDE, programmeFormation: [PIECE] }, {})).toBe(
      "Mes documents : 2 documents restants à déposer.",
    );
  });

  it("ne dit rien quand un document déjà déposé reçoit une pièce de plus", () => {
    const depose = { ...VIDE, programmeFormation: [PIECE] };
    expect(
      formatDocumentsStatutChange(depose, { ...depose, programmeFormation: [PIECE, PIECE] }, {}),
    ).toBe("");
  });

  it("annonce le volet complet, puis de nouveau à déposer quand on retire la dernière pièce", () => {
    const presque = { ...VIDE, programmeFormation: [PIECE], calendrierFormation: [PIECE] };
    const complet = { ...presque, devisFormation: [PIECE] };
    expect(formatDocumentsStatutChange(presque, complet, {})).toBe("Mes documents : complet.");
    expect(formatDocumentsStatutChange({ ...VIDE, devisFormation: [PIECE] }, VIDE, {})).toBe(
      "Mes documents : 3 documents à déposer.",
    );
  });
});
