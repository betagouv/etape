import { Module } from "@nestjs/common";

import { AccountModule } from "../account/account.module.js";
import { HabilitationModule } from "../habilitation/habilitation.module.js";
import { AuthController } from "./auth.controller.js";
import { HabilitationGuard } from "./habilitation.guard.js";
import { OidcService } from "./oidc.service.js";
import { SessionGuard } from "./session/session.guard.js";
import { SessionService } from "./session/session.service.js";
import { PrismaSessionStore, SessionStore } from "./session/session.store.js";

/**
 * Le reste de l'application ne dépend que de `SessionService` et `SessionGuard`,
 * jamais de Keycloak : changer d'IAM revient à réécrire `OidcService`. De même
 * pour le stockage des sessions, qui tient dans le seul `useClass` ci-dessous.
 */
@Module({
  imports: [AccountModule, HabilitationModule],
  controllers: [AuthController],
  providers: [
    OidcService,
    SessionService,
    SessionGuard,
    HabilitationGuard,
    { provide: SessionStore, useClass: PrismaSessionStore },
  ],
  exports: [SessionService, SessionGuard, HabilitationGuard],
})
export class AuthModule {}
