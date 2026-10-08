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
  app.set("trust proxy", config.get("TRUST_PROXY_HOPS", { infer: true }));
  app.use(helmet());
  app.use(cookieParser());

  // Pas de CORS : en production, nginx sert l'API sous `/api/`, sur la même
  // origine que les pages ; en local, le proxy de Vite relaie `/api` depuis
  // front-office et back-office. Aucune page d'une autre origine n'a à lire
  // l'API.

  // Une redirection servie depuis un cache rejouerait un `state` déjà consommé.
  app.set("etag", false);

  const port = config.get("API_PORT", { infer: true });
  await app.listen(port);

  Logger.log(`API démarrée sur http://localhost:${port}/${API_PREFIX}`, "Bootstrap");
}

void bootstrap();
