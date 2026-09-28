import { Module } from "@nestjs/common";

import { HabilitationRepository } from "./habilitation.repository.js";
import { HabilitationService } from "./habilitation.service.js";
import { PrismaHabilitationRepository } from "./habilitation.prisma-repository.js";

@Module({
  providers: [
    HabilitationService,
    { provide: HabilitationRepository, useClass: PrismaHabilitationRepository },
  ],
  exports: [HabilitationService],
})
export class HabilitationModule {}
