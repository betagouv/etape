import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AccountModule } from "../account/account.module.js";
import type { Env } from "../config/env.js";
import { AuthController } from "./auth.controller.js";
import { buildFrontConfigs, FRONT_CONFIGS } from "./front.js";
import { FrontGuard } from "./front.guard.js";
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
  imports: [AccountModule],
  controllers: [AuthController],
  providers: [
    {
      provide: FRONT_CONFIGS,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => buildFrontConfigs(config),
    },
    FrontGuard,
    OidcService,
    SessionService,
    SessionGuard,
    { provide: SessionStore, useClass: PrismaSessionStore },
  ],
  exports: [FRONT_CONFIGS, FrontGuard, SessionService, SessionGuard],
})
export class AuthModule {}
