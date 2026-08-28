import { z } from "zod";

/**
 * Validé au démarrage : un issuer absent doit empêcher le service de se lever,
 * pas produire une 500 au premier clic sur « Se connecter ».
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(3002),

  /** Sans slash final : la `redirect_uri` en dérive, au caractère près. */
  API_BASE_URL: z.url(),
  /** Sans slash final. */
  FRONT_BASE_URL: z.url(),

  /** De la forme `https://<keycloak>/realms/etape`. */
  KEYCLOAK_ISSUER_URL: z.url(),
  KEYCLOAK_CLIENT_ID: z.string().min(1),
  /** Interdit l'échange de jetons depuis le navigateur, d'où cette API. */
  KEYCLOAK_CLIENT_SECRET: z.string().min(1),
  /** Transmis en `kc_idp_hint`. */
  KEYCLOAK_FRANCECONNECT_ALIAS: z.string().min(1).default("franceconnect"),
});

export type Env = z.infer<typeof envSchema>;

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
