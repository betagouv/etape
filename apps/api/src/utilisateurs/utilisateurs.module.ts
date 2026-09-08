import { Module } from "@nestjs/common";

import { UtilisateursService } from "./utilisateurs.service.js";

@Module({
  providers: [UtilisateursService],
  exports: [UtilisateursService],
})
export class UtilisateursModule {}
