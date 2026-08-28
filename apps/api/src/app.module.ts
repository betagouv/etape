import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AuthModule } from "./auth/auth.module.js";
import { validateEnv } from "./config/env.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Une configuration invalide doit empêcher le démarrage, pas produire une
      // erreur au premier clic sur « Se connecter ».
      validate: validateEnv,
      cache: true,
    }),
    AuthModule,
  ],
})
export class AppModule {}
