import { defineConfig } from "prisma/config";

/**
 * Configuration du **CLI** Prisma : `migrate`, `generate`, `studio`. Elle est
 * obligatoire depuis Prisma 7, qui n'accepte plus d'`url` dans le schéma.
 *
 * L'exécution, elle, ne passe pas par ici : le client reçoit son adaptateur
 * `pg` de `PrismaService`, à partir de la même variable validée par `env.ts`.
 */

// Prisma 7 ne charge plus `.env` de lui-même, et `@nestjs/config` ne le fait
// qu'au démarrage de l'application — trop tard pour une commande du CLI.
// `loadEnvFile` évite d'ajouter `dotenv` pour cette seule ligne ; il ne remplace
// aucune variable déjà posée, l'environnement garde donc le dernier mot.
try {
  process.loadEnvFile();
} catch {
  // Pas de `.env` : les variables viennent de l'environnement, comme en
  // production. Ce n'est pas une erreur.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL },
});
