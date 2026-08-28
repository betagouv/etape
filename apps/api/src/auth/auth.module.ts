import { Module } from "@nestjs/common";

import { AuthController } from "./auth.controller.js";
import { OidcService } from "./oidc.service.js";
import { SessionGuard } from "./session/session.guard.js";
import { SessionService } from "./session/session.service.js";
import { InMemorySessionStore, SessionStore } from "./session/session.store.js";

/**
 * Le reste de l'application ne dépend que de `SessionService` et `SessionGuard`,
 * jamais de Keycloak : changer d'IAM revient à réécrire `OidcService`. Passer du
 * stockage mémoire à Redis se fait dans le seul `useClass` ci-dessous.
 */
@Module({
  controllers: [AuthController],
  providers: [
    OidcService,
    SessionService,
    SessionGuard,
    { provide: SessionStore, useClass: InMemorySessionStore },
  ],
  exports: [SessionService, SessionGuard],
})
export class AuthModule {}
