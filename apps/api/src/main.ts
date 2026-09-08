import "reflect-metadata";

import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import { AppModule } from "./app.module.js";
import type { Env } from "./config/env.js";

/**
 * Porté par l'application et non retiré par le proxy : les chemins vus par Nest
 * sont ceux vus par le navigateur. Une réécriture produirait un
 * `redirect_uri_mismatch` visible en production seulement.
 */
const API_PREFIX = "api";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config: ConfigService<Env, true> = app.get(ConfigService);

  app.setGlobalPrefix(API_PREFIX);
  app.use(helmet());
  app.use(cookieParser());

  // Inutile en production (origine commune), nécessaire en développement.
  // `credentials` sans quoi le cookie de session ne serait pas envoyé.
  app.enableCors({
    origin: config.get("FRONT_BASE_URL", { infer: true }),
    credentials: true,
  });

  // Une redirection servie depuis un cache rejouerait un `state` déjà consommé.
  app.set("etag", false);

  const port = config.get("API_PORT", { infer: true });
  await app.listen(port);

  Logger.log(`API démarrée sur http://localhost:${port}/${API_PREFIX}`, "Bootstrap");
}

void bootstrap();
