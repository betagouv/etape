import { Module } from "@nestjs/common";

import { PrismaJournalSecuriteRepository } from "./journal-securite.prisma-repository.js";
import { JournalSecuriteRepository } from "./journal-securite.repository.js";

/** Exporte son repository : chaque service trace dans sa propre transaction. */
@Module({
  providers: [{ provide: JournalSecuriteRepository, useClass: PrismaJournalSecuriteRepository }],
  exports: [JournalSecuriteRepository],
})
export class JournalSecuriteModule {}
