import { ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it } from "vitest";

import type { Actor, CibleDossier } from "../authorization/authorization.types.js";
import { TransactionRunner } from "../database/transaction-runner.js";
import type { RlsContext, Transaction } from "../database/transaction.types.js";
import { STATUT_DOSSIER } from "../dossier/dossier.enum.js";
import type { DossierRepository } from "../dossier/dossier.repository.js";
import { HABILITATION_TYPE } from "../habilitation/habilitation.enum.js";
import { CIBLE_JOURNAL, EVENEMENT_SECURITE } from "../journal-securite/journal-securite.enum.js";
import type { JournalSecuriteRepository } from "../journal-securite/journal-securite.repository.js";
import type { EntreeJournal } from "../journal-securite/journal-securite.types.js";
import { STATUT_PIECE } from "./piece-justificative.enum.js";
import type { PieceJustificativeRepository } from "./piece-justificative.repository.js";
import { PieceJustificativeService } from "./piece-justificative.service.js";
import type { PieceJustificative, ValidationPiece } from "./piece-justificative.types.js";

const DOSSIER_ID = "11111111-1111-4111-8111-111111111111";
const PIECE_ID = "22222222-2222-4222-8222-222222222222";

const TX = {} as Transaction;

/** Enregistre les contextes RLS demandés : c'est ce que la base appliquera. */
class FakeTransactionRunner extends TransactionRunner {
  readonly contexts: RlsContext[] = [];

  run<T>(context: RlsContext, work: (tx: Transaction) => Promise<T>): Promise<T> {
    this.contexts.push(context);
    return work(TX);
  }
}

class FakeDossierRepository implements DossierRepository {
  cible: CibleDossier | null = null;

  async findCibleById(): Promise<CibleDossier | null> {
    return this.cible;
  }
}

class FakePieceJustificativeRepository implements PieceJustificativeRepository {
  piece: PieceJustificative | null = null;
  /** Simule un autre instructeur qui contrôle la pièce entre lecture et écriture. */
  isControleeEntreTemps = false;
  readonly validations: ValidationPiece[] = [];

  async findInDossier(): Promise<PieceJustificative | null> {
    return this.piece;
  }

  async markValidee(
    _tx: Transaction,
    validation: ValidationPiece,
  ): Promise<PieceJustificative | null> {
    if (this.isControleeEntreTemps || !this.piece) return null;
    this.validations.push(validation);
    return {
      ...this.piece,
      statut: STATUT_PIECE.VALIDEE,
      instructeurId: validation.instructeurId,
      dateControle: validation.dateControle,
    };
  }
}

class FakeJournalSecuriteRepository implements JournalSecuriteRepository {
  readonly entrees: EntreeJournal[] = [];

  async record(_tx: Transaction, entree: EntreeJournal): Promise<void> {
    this.entrees.push(entree);
  }
}

const instructeur: Actor = {
  accountId: "ines",
  habilitations: [{ type: HABILITATION_TYPE.INSTRUCTEUR, accountId: "ines", regionId: "93" }],
};
const admin: Actor = {
  accountId: "adam",
  habilitations: [{ type: HABILITATION_TYPE.ADMIN, accountId: "adam", regionId: "93" }],
};

describe("PieceJustificativeService.validatePiece", () => {
  let transactions: FakeTransactionRunner;
  let dossiers: FakeDossierRepository;
  let pieces: FakePieceJustificativeRepository;
  let journal: FakeJournalSecuriteRepository;
  let service: PieceJustificativeService;

  beforeEach(() => {
    transactions = new FakeTransactionRunner();
    dossiers = new FakeDossierRepository();
    pieces = new FakePieceJustificativeRepository();
    journal = new FakeJournalSecuriteRepository();
    service = new PieceJustificativeService(transactions, dossiers, pieces, journal);

    dossiers.cible = {
      type: "dossier",
      dossierId: DOSSIER_ID,
      regionId: "93",
      beneficiaireId: "alice",
      statut: STATUT_DOSSIER.SOUMIS,
      membreCommissionIds: [],
    };
    pieces.piece = {
      id: PIECE_ID,
      dossierId: DOSSIER_ID,
      typePieceId: "type",
      version: 1,
      statut: STATUT_PIECE.DEPOSEE,
    };
  });

  it("valide la pièce, sous le contexte RLS de l'acteur, et journalise", async () => {
    const piece = await service.validatePiece(instructeur, DOSSIER_ID, PIECE_ID);

    expect(piece.statut).toBe(STATUT_PIECE.VALIDEE);
    expect(piece.instructeurId).toBe(instructeur.accountId);
    expect(transactions.contexts).toEqual([{ accountId: "ines", regionIds: ["93"] }]);
    expect(journal.entrees).toEqual([
      {
        evenement: EVENEMENT_SECURITE.PIECE_VALIDATION,
        accountId: "ines",
        regionId: "93",
        dossierId: DOSSIER_ID,
        cible: { type: CIBLE_JOURNAL.PIECE_JUSTIFICATIVE, id: PIECE_ID },
      },
    ]);
  });

  it("404 si le dossier est introuvable ou hors RLS", async () => {
    dossiers.cible = null;
    await expect(service.validatePiece(instructeur, DOSSIER_ID, PIECE_ID)).rejects.toThrow(
      NotFoundException,
    );
  });

  it("403 pour un admin de la même région : la RLS le laisse voir, la matrice refuse", async () => {
    await expect(service.validatePiece(admin, DOSSIER_ID, PIECE_ID)).rejects.toThrow(
      ForbiddenException,
    );
    expect(pieces.validations).toEqual([]);
    expect(journal.entrees).toEqual([]);
  });

  it("403 hors des statuts de la matrice", async () => {
    dossiers.cible = { ...dossiers.cible!, statut: STATUT_DOSSIER.BROUILLON };
    await expect(service.validatePiece(instructeur, DOSSIER_ID, PIECE_ID)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("404 si la pièce n'appartient pas au dossier", async () => {
    pieces.piece = null;
    await expect(service.validatePiece(instructeur, DOSSIER_ID, PIECE_ID)).rejects.toThrow(
      NotFoundException,
    );
  });

  it("409 si la pièce est déjà contrôlée", async () => {
    pieces.piece = { ...pieces.piece!, statut: STATUT_PIECE.REFUSEE };
    await expect(service.validatePiece(instructeur, DOSSIER_ID, PIECE_ID)).rejects.toThrow(
      ConflictException,
    );
  });

  it("409 si un autre instructeur l'a contrôlée entre-temps, sans journaliser", async () => {
    pieces.isControleeEntreTemps = true;
    await expect(service.validatePiece(instructeur, DOSSIER_ID, PIECE_ID)).rejects.toThrow(
      ConflictException,
    );
    expect(journal.entrees).toEqual([]);
  });
});
