import { Module } from "@nestjs/common";

import { UtilisateursModule } from "../utilisateurs/utilisateurs.module.js";
import { AuthController } from "./auth.controller.js";
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
  imports: [UtilisateursModule],
  controllers: [AuthController],
  providers: [
    OidcService,
    SessionService,
    SessionGuard,
    { provide: SessionStore, useClass: PrismaSessionStore },
  ],
  exports: [SessionService, SessionGuard],
})
export class AuthModule {}
