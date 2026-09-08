import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";

import type { Env } from "../config/env.js";
import { PrismaClient } from "../generated/prisma/client.ts";

/**
 * Seul point de contact avec Prisma : le reste de l'application injecte ce
 * service et ne connaît ni l'adaptateur, ni l'URL de la base. Même partage des
 * rôles qu'`OidcService` pour Keycloak — changer de couche d'accès se joue ici.
 *
 * Prisma 7 n'embarque plus de moteur : la connexion passe par un adaptateur, ici
 * `pg`, construit à partir de la variable validée au démarrage par `env.ts`.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService<Env, true>) {
    super({
      adapter: new PrismaPg({
        connectionString: config.get("DATABASE_URL", { infer: true }),
      }),
    });
  }

  /**
   * Connexion **au démarrage**, et non à la première requête : sans base, rien
   * ne fonctionne — ni les sessions, ni les comptes. Autant que la panne se voie
   * au lancement plutôt qu'au premier clic.
   *
   * C'est l'inverse du choix fait pour la découverte OIDC, paresseuse parce que
   * l'API et Keycloak démarrent en parallèle.
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log("Connexion à la base applicative établie.");
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
