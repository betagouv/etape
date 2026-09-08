import { Global, Module } from "@nestjs/common";

import { PrismaService } from "./prisma.service.js";

/**
 * Global : la base est une dépendance transverse, et la réimporter dans chaque
 * module qui écrit une ligne n'apprendrait rien à personne.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class BaseDeDonneesModule {}
