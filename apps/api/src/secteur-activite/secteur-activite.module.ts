import { Module } from "@nestjs/common";

import { SecteurActiviteController } from "./secteur-activite.controller.js";
import { SecteurActiviteService } from "./secteur-activite.service.js";

@Module({
  controllers: [SecteurActiviteController],
  providers: [SecteurActiviteService],
})
export class SecteurActiviteModule {}
