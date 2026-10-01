import { ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Actor } from "../authorization/authorization.types.js";
import type { Env } from "../config/env.js";
import { PrismaTransactionRunner } from "../database/prisma-transaction-runner.js";
import { PrismaService } from "../database/prisma.service.js";
import { PrismaDossierRepository } from "../dossier/dossier.prisma-repository.js";
import { PrismaClient } from "../generated/prisma/client.ts";
import { HABILITATION_TYPE } from "../habilitation/habilitation.enum.js";
import { EVENEMENT_SECURITE } from "../journal-securite/journal-securite.enum.js";
import { PrismaJournalSecuriteRepository } from "../journal-securite/journal-securite.prisma-repository.js";
import { STATUT_PIECE } from "./piece-justificative.enum.js";
import { PrismaPieceJustificativeRepository } from "./piece-justificative.prisma-repository.js";
import { PieceJustificativeService } from "./piece-justificative.service.js";

/**
 * Le service et ses repositories Prisma contre une vraie base : la matrice,
 * la RLS et le journal ensemble.
 *
 * - `TEST_DATABASE_URL`       : rôle `etape_app` (NOBYPASSRLS), comme l'API ;
 * - `TEST_DATABASE_ADMIN_URL` : superutilisateur, pour poser et retirer le jeu
 *   de données (un superutilisateur ignore la RLS).
 *
 * Base migrée et amorcée avec `prisma/tests/seed-rls.sql`. Sans ces variables,
 * la suite est ignorée (CI sans base).
 *
 * Les classes sont instanciées à la main : Vitest transpile avec esbuild, qui
 * n'émet pas les métadonnées de décorateurs dont l'injection de NestJS a
 * besoin. Démarrer `AppModule` ici demanderait `unplugin-swc`.
 */
const APP_URL = process.env.TEST_DATABASE_URL;
const ADMIN_URL = process.env.TEST_DATABASE_ADMIN_URL;

const PACA = "93";
const NOUVELLE_AQUITAINE = "75";
const DOSSIER_ALICE = "00000000-0000-0000-0000-0000000d0a01"; // PACA
const ALICE = "00000000-0000-0000-0000-00000000b0a1";
const SUPER_ADMIN = "00000000-0000-0000-0000-00000000ad01";
const INSTRUCTEUR_PACA = "00000000-0000-0000-0000-00000000a9e1";
const INSTRUCTEUR_NA = "00000000-0000-0000-0000-00000000a9e2";
const ADMIN_PACA = "00000000-0000-0000-0000-0000000ad093";
const TYPE_PIECE = "00000000-0000-0000-0000-00000000719e";
const PIECE = "00000000-0000-0000-0000-000000009ec1";

const instructeurPaca: Actor = {
  accountId: INSTRUCTEUR_PACA,
  habilitations: [
    { type: HABILITATION_TYPE.INSTRUCTEUR, accountId: INSTRUCTEUR_PACA, regionId: PACA },
  ],
};
const instructeurNa: Actor = {
  accountId: INSTRUCTEUR_NA,
  habilitations: [
    {
      type: HABILITATION_TYPE.INSTRUCTEUR,
      accountId: INSTRUCTEUR_NA,
      regionId: NOUVELLE_AQUITAINE,
    },
  ],
};
const adminPaca: Actor = {
  accountId: ADMIN_PACA,
  habilitations: [{ type: HABILITATION_TYPE.ADMIN, accountId: ADMIN_PACA, regionId: PACA }],
};

describe.skipIf(!APP_URL || !ADMIN_URL)(
  "PieceJustificativeService, base réelle (rôle etape_app)",
  () => {
    let admin: PrismaClient;
    let prisma: PrismaService;
    let service: PieceJustificativeService;

    async function nettoyer(): Promise<void> {
      await admin.$executeRaw`DELETE FROM journal_securite WHERE cible_id = ${PIECE}::uuid`;
      await admin.$executeRaw`DELETE FROM piece_justificative WHERE id = ${PIECE}::uuid`;
      await admin.$executeRaw`DELETE FROM type_piece WHERE id = ${TYPE_PIECE}::uuid`;
      await admin.$executeRaw`DELETE FROM habilitation WHERE account_id = ${ADMIN_PACA}::uuid`;
      await admin.$executeRaw`DELETE FROM account WHERE id = ${ADMIN_PACA}::uuid`;
      await admin.$executeRaw`UPDATE dossier SET statut = 'BROUILLON' WHERE id = ${DOSSIER_ALICE}::uuid`;
    }

    beforeAll(async () => {
      admin = new PrismaClient({ adapter: new PrismaPg({ connectionString: ADMIN_URL }) });
      await nettoyer();
      await admin.$executeRaw`INSERT INTO account (id, realm, keycloak_sub, first_login_identity_provider, last_login_identity_provider)
                            VALUES (${ADMIN_PACA}::uuid, 'etape-pro', 'sub-admin-paca-integration', 'local', 'local')`;
      await admin.$executeRaw`INSERT INTO habilitation (account_id, role, region_id, auteur_attribution_id)
                            VALUES (${ADMIN_PACA}::uuid, 'ADMIN', ${PACA}, ${SUPER_ADMIN}::uuid)`;
      await admin.$executeRaw`INSERT INTO type_piece (id, code, libelle, dispositif, is_obligatoire)
                            VALUES (${TYPE_PIECE}::uuid, 'TEST_INTEGRATION', 'Pièce de test', 'DD', true)`;
      await admin.$executeRaw`UPDATE dossier SET statut = 'SOUMIS' WHERE id = ${DOSSIER_ALICE}::uuid`;
      await admin.$executeRaw`INSERT INTO piece_justificative
                              (id, dossier_id, type_piece_id, account_id, storage_key, filename, mime_type, size, sha256, updated_at)
                            VALUES (${PIECE}::uuid, ${DOSSIER_ALICE}::uuid, ${TYPE_PIECE}::uuid, ${ALICE}::uuid,
                                    'test/piece.pdf', 'piece.pdf', 'application/pdf', 1, repeat('a', 64), now())`;

      prisma = new PrismaService({ get: () => APP_URL } as unknown as ConfigService<Env, true>);
      service = new PieceJustificativeService(
        new PrismaTransactionRunner(prisma),
        new PrismaDossierRepository(),
        new PrismaPieceJustificativeRepository(),
        new PrismaJournalSecuriteRepository(),
      );
    });

    afterAll(async () => {
      await prisma?.$disconnect();
      if (admin) {
        await nettoyer();
        await admin.$disconnect();
      }
    });

    it("l'instructeur d'une autre région : 404, la RLS ne lui montre pas le dossier", async () => {
      await expect(service.validatePiece(instructeurNa, DOSSIER_ALICE, PIECE)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("l'admin de la région : 403, la RLS lui montre le dossier mais la matrice refuse", async () => {
      await expect(service.validatePiece(adminPaca, DOSSIER_ALICE, PIECE)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("l'instructeur de la région valide, et l'action est journalisée", async () => {
      const piece = await service.validatePiece(instructeurPaca, DOSSIER_ALICE, PIECE);
      expect(piece.statut).toBe(STATUT_PIECE.VALIDEE);
      expect(piece.instructeurId).toBe(INSTRUCTEUR_PACA);

      const journal = await admin.journalSecurite.findMany({ where: { cibleId: PIECE } });
      expect(journal).toHaveLength(1);
      expect(journal[0]).toMatchObject({
        evenement: EVENEMENT_SECURITE.PIECE_VALIDATION,
        accountId: INSTRUCTEUR_PACA,
        regionId: PACA,
        dossierId: DOSSIER_ALICE,
      });
    });

    it("une seconde validation : 409", async () => {
      await expect(service.validatePiece(instructeurPaca, DOSSIER_ALICE, PIECE)).rejects.toThrow(
        ConflictException,
      );
    });
  },
);
