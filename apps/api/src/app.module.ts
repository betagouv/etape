import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { minutes, ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { AuthModule } from "./auth/auth.module.js";
import { CsrfGuard } from "./auth/csrf.guard.js";
import { FrontGuard } from "./auth/front.guard.js";
import { validateEnv } from "./config/env.js";
import { DatabaseModule } from "./database/database.module.js";
import { EtablissementModule } from "./etablissement/etablissement.module.js";
import { MetierRomeModule } from "./metier-rome/metier-rome.module.js";
import { SecteurActiviteModule } from "./secteur-activite/secteur-activite.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Une configuration invalide doit empêcher le démarrage, pas produire une
      // erreur au premier clic sur « Se connecter ».
      validate: validateEnv,
      cache: true,
    }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: minutes(1), limit: 300 }] }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    EtablissementModule,
    MetierRomeModule,
    SecteurActiviteModule,
  ],
  // Dans cet ordre : le front d'abord, qu'un hôte inconnu soit refusé avant de
  // compter dans la limite de débit, et que la garde CSRF connaisse l'origine
  // attendue.
  providers: [
    { provide: APP_GUARD, useExisting: FrontGuard },
    { provide: APP_GUARD, useExisting: CsrfGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
