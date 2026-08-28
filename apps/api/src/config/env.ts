import { z } from "zod";

/**
 * Schéma des variables d'environnement, validé au démarrage : un issuer absent
 * doit empêcher le service de se lever, pas produire une 500 le jour où
 * quelqu'un clique sur « Se connecter ».
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(3002),

  /**
   * URL publique de l'API, sans slash final. La `redirect_uri` en dérive, et
   * doit correspondre au caractère près à celle déclarée dans le realm.
   */
  API_BASE_URL: z.url(),

  /** URL publique du front, sans slash final. Fin de parcours et déconnexion. */
  FRONT_BASE_URL: z.url(),

  /** De la forme `https://<keycloak>/realms/etape`. */
  KEYCLOAK_ISSUER_URL: z.url(),
  KEYCLOAK_CLIENT_ID: z.string().min(1),

  /**
   * Secret du client confidentiel. C'est lui qui interdit l'échange de jetons
   * depuis le navigateur, et donc ce qui impose l'existence de cette API.
   */
  KEYCLOAK_CLIENT_SECRET: z.string().min(1),

  /** `alias` de l'identity provider FranceConnect, transmis en `kc_idp_hint`. */
  KEYCLOAK_FRANCECONNECT_ALIAS: z.string().min(1).default("franceconnect"),
});

export type Env = z.infer<typeof envSchema>;

/** Branché sur l'option `validate` de `ConfigModule`, qui interrompt le démarrage. */
export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(racine)"} : ${issue.message}`)
      .join("\n");

    throw new Error(`Configuration d'environnement invalide :\n${details}`);
  }

  return result.data;
}
