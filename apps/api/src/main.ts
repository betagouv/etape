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
 * Préfixe porté par l'application elle-même, et non retiré par le proxy.
 *
 * nginx se contente alors de transmettre `/api/` sans réécriture : les chemins
 * vus par Nest sont ceux vus par le navigateur. Toute `redirect_uri` déclarée
 * dans Keycloak reste ainsi valable des deux côtés du proxy — une réécriture
 * décalerait les deux vues et produirait un `redirect_uri_mismatch` qui ne se
 * manifesterait qu'en production.
 */
const API_PREFIX = "api";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config: ConfigService<Env, true> = app.get(ConfigService);

  app.setGlobalPrefix(API_PREFIX);
  app.use(helmet());
  app.use(cookieParser());

  // En production, front et API partagent l'origine derrière nginx et CORS ne
  // joue aucun rôle. En développement ils vivent sur deux ports, d'où cette
  // autorisation explicite — `credentials` est indispensable, sans quoi le
  // navigateur n'enverra pas le cookie de session.
  app.enableCors({
    origin: config.get("FRONT_BASE_URL", { infer: true }),
    credentials: true,
  });

  // Les redirections vers Keycloak sont l'essentiel du trafic de ce service :
  // elles ne doivent jamais être servies depuis un cache, sous peine de rejouer
  // un `state` déjà consommé.
  app.set("etag", false);

  const port = config.get("API_PORT", { infer: true });
  await app.listen(port);

  Logger.log(`API démarrée sur http://localhost:${port}/${API_PREFIX}`, "Bootstrap");
}

void bootstrap();
