import { Module } from "@nestjs/common";

import { FranceTravailClient } from "./france-travail.client.js";
import { PrismaMetierRomeRepository } from "./metier-rome.prisma-repository.js";
import { MetierRomeRepository } from "./metier-rome.repository.js";
import { MetierRomeService } from "./metier-rome.service.js";
import { MetierRomeSyncTask } from "./metier-rome.task.js";

@Module({
  providers: [
    FranceTravailClient,
    MetierRomeService,
    MetierRomeSyncTask,
    { provide: MetierRomeRepository, useClass: PrismaMetierRomeRepository },
  ],
})
export class MetierRomeModule {}
