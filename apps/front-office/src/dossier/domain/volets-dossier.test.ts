import { describe, expect, it } from "vitest";

import { VOLET_ID } from "./volet-id";
import { findVoletLabel, VOLETS_DOSSIER } from "./volets-dossier";

describe("findVoletLabel", () => {
  it("donne le libellé du volet", () => {
    expect(findVoletLabel(VOLET_ID.SITUATION_PROFESSIONNELLE)).toBe("Ma situation professionnelle");
  });

  it("donne un libellé à chaque volet du dossier", () => {
    for (const { id, label } of VOLETS_DOSSIER) expect(findVoletLabel(id)).toBe(label);
  });

  it("donne le libellé du menu, pas le titre de l'écran", () => {
    expect(findVoletLabel(VOLET_ID.CEP)).toBe("Mon CEP");
  });
});

describe("VOLETS_DOSSIER", () => {
  it("place « Mes documents » en sixième, entre « Ma formation » et « Mon CEP »", () => {
    expect(VOLETS_DOSSIER.map(({ id }) => id)).toEqual([
      VOLET_ID.INFORMATIONS,
      VOLET_ID.SITUATION_PROFESSIONNELLE,
      VOLET_ID.FUTUR_METIER,
      VOLET_ID.PROJET,
      VOLET_ID.FORMATION,
      VOLET_ID.DOCUMENTS,
      VOLET_ID.CEP,
    ]);
  });

  it("donne à « Mes documents » les formats acceptés et la taille maximale", () => {
    const documents = VOLETS_DOSSIER.find(({ id }) => id === VOLET_ID.DOCUMENTS);
    expect(documents?.notice?.description).toBe(
      "Formats acceptés : PDF, JPG, JPEG, PNG, DOCX, XLSX, CSV. Taille maximale : 10 Mo par fichier. Un document de plusieurs pages peut être déposé en plusieurs fichiers.",
    );
  });
});
