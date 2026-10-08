import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { minutes, ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { AuthModule } from "./auth/auth.module.js";
import { FrontGuard } from "./auth/front.guard.js";
import { validateEnv } from "./config/env.js";
import { DatabaseModule } from "./database/database.module.js";

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
    DatabaseModule,
    AuthModule,
  ],
  // Le front d'abord : un hôte inconnu est refusé avant de compter dans la
  // limite de débit.
  providers: [
    { provide: APP_GUARD, useExisting: FrontGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
