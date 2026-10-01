import { Module } from "@nestjs/common";

import { HabilitationModule } from "../habilitation/habilitation.module.js";
import { AuthorizationGuard } from "./authorization.guard.js";

/**
 * Tout module qui pose `@UseGuards(AuthorizationGuard)` l'importe. La matrice,
 * `can` et `assertCan` sont des fonctions pures : elles s'importent
 * directement, sans passer par l'injection.
 */
@Module({
  imports: [HabilitationModule],
  providers: [AuthorizationGuard],
  exports: [AuthorizationGuard, HabilitationModule],
})
export class AuthorizationModule {}
