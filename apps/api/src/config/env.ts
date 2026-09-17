import { z } from "zod";

const COOKIE_ENCRYPTION_KEY_BYTES = 32;

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

  /** 32 octets en base64 : `openssl rand -base64 32`. */
  COOKIE_ENCRYPTION_KEY: z
    .base64()
    .refine((value) => Buffer.from(value, "base64").length === COOKIE_ENCRYPTION_KEY_BYTES, {
      message: "32 octets encodés en base64 attendus (openssl rand -base64 32)",
    }),

  /** Proxys devant l'API : sans eux, toutes les requêtes partagent l'IP du dernier. */
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),

  DATABASE_URL: z.url(),
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
