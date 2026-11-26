import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { CertificationController } from "./certification.controller.js";
import { PrismaCertificationRepository } from "./certification.prisma-repository.js";
import { CertificationRepository } from "./certification.repository.js";
import { CertificationService } from "./certification.service.js";
import { CertificationSyncTask } from "./certification.task.js";
import { FranceCompetencesClient } from "./france-competences.client.js";

@Module({
  imports: [AuthModule],
  controllers: [CertificationController],
  providers: [
    FranceCompetencesClient,
    CertificationService,
    CertificationSyncTask,
    { provide: CertificationRepository, useClass: PrismaCertificationRepository },
  ],
})
export class CertificationModule {}
