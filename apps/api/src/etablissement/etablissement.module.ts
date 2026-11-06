import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { EtablissementController } from "./etablissement.controller.js";
import { EtablissementService } from "./etablissement.service.js";

@Module({
  imports: [AuthModule],
  controllers: [EtablissementController],
  providers: [EtablissementService],
})
export class EtablissementModule {}
