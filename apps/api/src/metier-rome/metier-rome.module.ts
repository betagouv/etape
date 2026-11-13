import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { AppellationRomeController } from "./appellation-rome.controller.js";
import { FranceTravailClient } from "./france-travail.client.js";
import { PrismaMetierRomeRepository } from "./metier-rome.prisma-repository.js";
import { MetierRomeRepository } from "./metier-rome.repository.js";
import { MetierRomeService } from "./metier-rome.service.js";
import { MetierRomeSyncTask } from "./metier-rome.task.js";

@Module({
  imports: [AuthModule],
  controllers: [AppellationRomeController],
  providers: [
    FranceTravailClient,
    MetierRomeService,
    MetierRomeSyncTask,
    { provide: MetierRomeRepository, useClass: PrismaMetierRomeRepository },
  ],
})
export class MetierRomeModule {}
