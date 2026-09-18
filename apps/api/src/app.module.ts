import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { minutes, ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { AuthModule } from "./auth/auth.module.js";
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
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
