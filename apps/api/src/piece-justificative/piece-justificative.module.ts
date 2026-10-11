import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { AuthorizationModule } from "../authorization/authorization.module.js";
import { DossierModule } from "../dossier/dossier.module.js";
import { JournalSecuriteModule } from "../journal-securite/journal-securite.module.js";
import { PieceJustificativeController } from "./piece-justificative.controller.js";
import { PrismaPieceJustificativeRepository } from "./piece-justificative.prisma-repository.js";
import { PieceJustificativeRepository } from "./piece-justificative.repository.js";
import { PieceJustificativeService } from "./piece-justificative.service.js";

/**
 * - `AuthModule`          → `SessionGuard` (et `SessionService` dont il dépend)
 * - `AuthorizationModule` → `AuthorizationGuard` (et `HabilitationService`)
 * - `DossierModule`       → `DossierRepository`, pour charger la cible
 * - `JournalSecuriteModule` → `JournalSecuriteRepository`
 * - `TransactionRunner` vient de `DatabaseModule`, global.
 */
@Module({
  imports: [AuthModule, AuthorizationModule, DossierModule, JournalSecuriteModule],
  controllers: [PieceJustificativeController],
  providers: [
    PieceJustificativeService,
    { provide: PieceJustificativeRepository, useClass: PrismaPieceJustificativeRepository },
  ],
})
export class PieceJustificativeModule {}
