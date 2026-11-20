import { describe, expect, it } from "vitest";

import {
  ACCEPT_PIECE_JUSTIFICATIVE,
  checkFichiers,
  findFormatFichier,
  formatAjoutAnnouncement,
  formatPieceDetails,
  formatRetraitAnnouncement,
  formatTaille,
  FORMATS_PIECE_JUSTIFICATIVE_LABEL,
  MOTIF_REFUS,
  type PieceJustificative,
} from "./piece-justificative";

const MO = 1_000_000;

/** Un fichier de la taille voulue, sans en écrire le contenu. */
function createFichier(nom: string, taille: number): File {
  const fichier = new File([], nom);
  Object.defineProperty(fichier, "size", { value: taille });
  return fichier;
}

function createPiece(nom: string, taille: number): PieceJustificative {
  return { id: nom, fichier: createFichier(nom, taille), dateDepot: new Date(2026, 8, 24) };
}

describe("formats acceptés", () => {
  it("s'affichent séparés par des virgules, et filtrent le sélecteur par extension", () => {
    expect(FORMATS_PIECE_JUSTIFICATIVE_LABEL).toBe("PDF, JPG, JPEG, PNG, DOCX, XLSX, CSV");
    expect(ACCEPT_PIECE_JUSTIFICATIVE).toBe(".pdf,.jpg,.jpeg,.png,.docx,.xlsx,.csv");
  });
});

describe("findFormatFichier", () => {
  it("lit la dernière extension, en majuscules", () => {
    expect(findFormatFichier("attestation-immersion.pdf")).toBe("PDF");
    expect(findFormatFichier("Compte.Rendu.DOCX")).toBe("DOCX");
  });

  it("ne trouve aucun format sans extension", () => {
    expect(findFormatFichier("attestation")).toBe("");
    expect(findFormatFichier(".pdf")).toBe("");
    expect(findFormatFichier("attestation.")).toBe("");
  });
});

describe("formatTaille", () => {
  it("affiche les Mo avec une décimale au plus, à la française", () => {
    expect(formatTaille(1_200_000)).toBe("1,2 Mo");
    expect(formatTaille(14 * MO)).toBe("14 Mo");
    expect(formatTaille(1_249_000)).toBe("1,2 Mo");
  });

  it("affiche les Ko en dessous de 1 Mo, arrondis au Ko supérieur", () => {
    expect(formatTaille(850_000)).toBe("850 Ko");
    expect(formatTaille(1)).toBe("1 Ko");
    expect(formatTaille(999_001)).toBe("1000 Ko");
  });
});

describe("formatPieceDetails", () => {
  it("donne le format, la taille et la date de dépôt, comme sur la maquette", () => {
    expect(formatPieceDetails(createPiece("attestation-immersion.pdf", 1_200_000))).toBe(
      "PDF · 1,2 Mo · Déposé le 24/09/2026",
    );
  });
});

describe("checkFichiers", () => {
  it("garde les fichiers d'un format accepté, sans regarder la casse de l'extension", () => {
    const fichiers = [createFichier("a.pdf", MO), createFichier("b.JPEG", MO)];

    expect(checkFichiers(fichiers)).toEqual({ accepted: fichiers, refus: [] });
  });

  it("refuse un format hors de la liste, avec le message du kit", () => {
    const { accepted, refus } = checkFichiers([createFichier("photo.heic", MO)]);

    expect(accepted).toEqual([]);
    expect(refus).toEqual([
      {
        nom: "photo.heic",
        motif: MOTIF_REFUS.FORMAT,
        message:
          "Ce format n’est pas accepté. Formats acceptés : PDF, JPG, JPEG, PNG, DOCX, XLSX, CSV.",
      },
    ]);
  });

  it("refuse un fichier de plus de 10 Mo, en disant sa taille, et accepte 10 Mo tout juste", () => {
    const { accepted, refus } = checkFichiers([
      createFichier("scan.pdf", 14 * MO),
      createFichier("limite.pdf", 10 * MO),
    ]);

    expect(accepted.map(({ name }) => name)).toEqual(["limite.pdf"]);
    expect(refus).toEqual([
      {
        nom: "scan.pdf",
        motif: MOTIF_REFUS.TAILLE,
        message:
          "Ce fichier fait 14 Mo, au-delà de la taille maximale de 10 Mo. Réduisez sa taille, ou déposez le document en plusieurs fichiers.",
      },
    ]);
  });

  it("regarde le format avant la taille", () => {
    const { refus } = checkFichiers([createFichier("video.mov", 80 * MO)]);

    expect(refus.map(({ motif }) => motif)).toEqual([MOTIF_REFUS.FORMAT]);
  });
});

describe("annonces", () => {
  it("nomme le fichier ajouté, ou compte les fichiers ajoutés", () => {
    const a = createFichier("a.pdf", MO);
    const b = createFichier("b.pdf", MO);

    expect(formatAjoutAnnouncement({ accepted: [a], refus: [] })).toBe("a.pdf ajouté.");
    expect(formatAjoutAnnouncement({ accepted: [a, b], refus: [] })).toBe("2 fichiers ajoutés.");
    expect(formatAjoutAnnouncement({ accepted: [], refus: [] })).toBe("");
  });

  it("dit chaque fichier refusé et pourquoi, après les fichiers ajoutés", () => {
    const checked = checkFichiers([createFichier("a.pdf", MO), createFichier("photo.heic", MO)]);

    expect(formatAjoutAnnouncement(checked)).toBe(
      "a.pdf ajouté. photo.heic refusé : Ce format n’est pas accepté. Formats acceptés : PDF, JPG, JPEG, PNG, DOCX, XLSX, CSV.",
    );
  });

  it("nomme la pièce retirée", () => {
    expect(formatRetraitAnnouncement("a.pdf")).toBe("a.pdf retiré.");
  });
});
