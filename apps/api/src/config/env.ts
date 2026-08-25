import { z } from "zod";

/**
 * Schéma des variables d'environnement de l'API.
 *
 * Validé au démarrage plutôt qu'au premier appel : une URL d'issuer absente doit
 * empêcher le service de se lever, pas produire une 500 le jour où quelqu'un
 * clique sur « Se connecter ».
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(3002),

  /**
   * URL publique de l'API, sans slash final. Sert à construire la `redirect_uri`
   * envoyée à Keycloak, qui doit correspondre au caractère près à celle déclarée
   * dans le client du realm.
   */
  API_BASE_URL: z.url(),

  /**
   * URL publique du front, sans slash final. Destination des redirections en fin
   * de parcours de connexion et de déconnexion.
   */
  FRONT_BASE_URL: z.url(),

  /** Issuer OIDC du realm, de la forme `https://<keycloak>/realms/etape`. */
  KEYCLOAK_ISSUER_URL: z.url(),
  KEYCLOAK_CLIENT_ID: z.string().min(1),

  /**
   * Secret du client confidentiel. C'est lui qui interdit de faire l'échange de
   * jetons depuis le navigateur, et donc ce qui impose l'existence de cette API.
   */
  KEYCLOAK_CLIENT_SECRET: z.string().min(1),

  /**
   * `alias` de l'identity provider FranceConnect dans le realm. Transmis à
   * Keycloak via `kc_idp_hint` pour court-circuiter son écran de connexion : le
   * bouton FranceConnect reste ainsi rendu par le front, seul endroit où l'on
   * maîtrise sa conformité au kit UX imposé.
   */
  KEYCLOAK_FRANCECONNECT_ALIAS: z.string().min(1).default("franceconnect"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Valide `process.env` et renvoie un objet typé.
 *
 * Branché sur l'option `validate` de `ConfigModule`, qui interrompt le démarrage
 * si une exception remonte.
 */
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
