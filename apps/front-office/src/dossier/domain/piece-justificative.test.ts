import { describe, expect, it } from "vitest";

import {
  ACCEPT_PIECE_JUSTIFICATIVE,
  applyPiecesChange,
  canPreviewFichier,
  checkFichiers,
  findFormatFichier,
  formatAddAnnouncement,
  formatPieceDetails,
  formatRemovalNotice,
  formatRemovalQuestion,
  formatRemoveAnnouncement,
  formatSize,
  FORMATS_PIECE_JUSTIFICATIVE_LABEL,
  REJECTION_REASON,
  type PieceJustificative,
} from "./piece-justificative";

const MO = 1_000_000;

/** Un fichier de la taille voulue, sans en écrire le contenu. */
function createFichier(name: string, size: number): File {
  const fichier = new File([], name);
  Object.defineProperty(fichier, "size", { value: size });
  return fichier;
}

function createPiece(name: string, size: number): PieceJustificative {
  return { id: name, fichier: createFichier(name, size), dateDepot: new Date(2026, 8, 24) };
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

describe("formatSize", () => {
  it("affiche les Mo avec une décimale au plus, à la française", () => {
    expect(formatSize(1_200_000)).toBe("1,2 Mo");
    expect(formatSize(14 * MO)).toBe("14 Mo");
    expect(formatSize(1_249_000)).toBe("1,2 Mo");
  });

  it("affiche les Ko en dessous de 1 Mo, arrondis au Ko supérieur", () => {
    expect(formatSize(850_000)).toBe("850 Ko");
    expect(formatSize(1)).toBe("1 Ko");
    expect(formatSize(999_001)).toBe("1000 Ko");
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

    expect(checkFichiers(fichiers)).toEqual({ accepted: fichiers, rejected: [] });
  });

  it("refuse un format hors de la liste, avec le message du kit", () => {
    const { accepted, rejected } = checkFichiers([createFichier("photo.heic", MO)]);

    expect(accepted).toEqual([]);
    expect(rejected).toEqual([
      {
        name: "photo.heic",
        reason: REJECTION_REASON.FORMAT,
        message:
          "Ce format n’est pas accepté. Formats acceptés : PDF, JPG, JPEG, PNG, DOCX, XLSX, CSV.",
      },
    ]);
  });

  it("refuse un fichier de plus de 10 Mo, en disant sa taille, et accepte 10 Mo tout juste", () => {
    const { accepted, rejected } = checkFichiers([
      createFichier("scan.pdf", 14 * MO),
      createFichier("limite.pdf", 10 * MO),
    ]);

    expect(accepted.map(({ name }) => name)).toEqual(["limite.pdf"]);
    expect(rejected).toEqual([
      {
        name: "scan.pdf",
        reason: REJECTION_REASON.SIZE,
        message:
          "Ce fichier fait 14 Mo, au-delà de la taille maximale de 10 Mo. Réduisez sa taille, ou déposez le document en plusieurs fichiers.",
      },
    ]);
  });

  it("dit une taille qui dépasse visiblement le maximum, même d'un octet", () => {
    const { rejected } = checkFichiers([
      createFichier("a.pdf", 10 * MO + 1),
      createFichier("b.pdf", 10_485_760),
    ]);

    expect(rejected.map(({ message }) => message.slice(0, 24))).toEqual([
      "Ce fichier fait 10,1 Mo,",
      "Ce fichier fait 10,5 Mo,",
    ]);
  });

  it("refuse un fichier vide", () => {
    const { accepted, rejected } = checkFichiers([createFichier("vide.pdf", 0)]);

    expect(accepted).toEqual([]);
    expect(rejected).toEqual([
      { name: "vide.pdf", reason: REJECTION_REASON.EMPTY, message: "Ce fichier est vide." },
    ]);
  });

  it("regarde le format avant la taille", () => {
    const { rejected } = checkFichiers([createFichier("video.mov", 80 * MO)]);

    expect(rejected.map(({ reason }) => reason)).toEqual([REJECTION_REASON.FORMAT]);
  });
});

describe("annonces", () => {
  it("nomme le fichier ajouté, ou compte les fichiers ajoutés", () => {
    const a = createFichier("a.pdf", MO);
    const b = createFichier("b.pdf", MO);

    expect(formatAddAnnouncement({ accepted: [a], rejected: [] })).toBe("a.pdf ajouté.");
    expect(formatAddAnnouncement({ accepted: [a, b], rejected: [] })).toBe("2 fichiers ajoutés.");
    expect(formatAddAnnouncement({ accepted: [], rejected: [] })).toBe("");
  });

  it("dit chaque fichier refusé et pourquoi, après les fichiers ajoutés", () => {
    const checked = checkFichiers([createFichier("a.pdf", MO), createFichier("photo.heic", MO)]);

    expect(formatAddAnnouncement(checked)).toBe(
      "a.pdf ajouté. photo.heic refusé : Ce format n’est pas accepté. Formats acceptés : PDF, JPG, JPEG, PNG, DOCX, XLSX, CSV.",
    );
  });

  it("nomme la pièce retirée", () => {
    expect(formatRemoveAnnouncement("a.pdf")).toBe("a.pdf retiré.");
  });
});

describe("confirmation de suppression", () => {
  it("demande s'il faut supprimer le fichier, puis dit quel autre volet le perd aussi", () => {
    expect(formatRemovalQuestion("a.pdf")).toBe("Supprimer a.pdf\u00a0?");
    expect(formatRemovalNotice("Mon futur métier")).toBe(
      "Il sera aussi retiré de «\u00a0Mon futur métier\u00a0».",
    );
  });
});

describe("canPreviewFichier", () => {
  it("ouvre dans un onglet les PDF et les images, sans regarder la casse", () => {
    expect(["a.pdf", "a.JPG", "a.jpeg", "a.png"].map(canPreviewFichier)).toEqual([
      true,
      true,
      true,
      true,
    ]);
  });

  it("fait télécharger ce que le navigateur n'affiche pas", () => {
    expect(["a.docx", "a.xlsx", "a.csv", "sans-extension"].map(canPreviewFichier)).toEqual([
      false,
      false,
      false,
      false,
    ]);
  });
});

describe("applyPiecesChange", () => {
  const a = createPiece("a.pdf", MO);
  const b = createPiece("b.pdf", MO);
  const saisie = createPiece("saisie.pdf", MO);

  it("ajoute les pièces gagnées et garde celles qui n'étaient que dans la liste", () => {
    expect(applyPiecesChange([saisie], [], [a])).toEqual([saisie, a]);
  });

  it("retire les pièces perdues, sans toucher aux autres", () => {
    expect(applyPiecesChange([a, saisie, b], [a, b], [b])).toEqual([saisie, b]);
  });

  it("n'ajoute pas deux fois une pièce que la liste a déjà", () => {
    expect(applyPiecesChange([a], [], [a])).toEqual([a]);
  });
});
