import { z } from "zod";

const COOKIE_ENCRYPTION_KEY_BYTES = 32;

const FRONT_URL_KEYS = [
  ["FRONT_OFFICE_BASE_URL", "FRONT_OFFICE_API_BASE_URL"],
  ["BACK_OFFICE_BASE_URL", "BACK_OFFICE_API_BASE_URL"],
] as const;

export const NODE_ENV = {
  DEVELOPMENT: "development",
  PRODUCTION: "production",
  TEST: "test",
} as const;

/**
 * Validé au démarrage : un issuer absent doit empêcher le service de se lever,
 * pas produire une 500 au premier clic sur « Se connecter ».
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(NODE_ENV).default(NODE_ENV.DEVELOPMENT),
    API_PORT: z.coerce.number().int().positive().default(3002),

    /**
     * Un front, une origine : chacune relaie son propre `/api` vers cette API, qui
     * le reconnaît à l'en-tête `Host` (voir `auth/front.ts`). Sans slash final.
     */
    FRONT_OFFICE_BASE_URL: z.url(),
    /** Préfixe `/api` inclus : la `redirect_uri` en dérive, au caractère près. */
    FRONT_OFFICE_API_BASE_URL: z.url(),
    /** Interdit l'échange de jetons depuis le navigateur, d'où cette API. */
    FRONT_OFFICE_KEYCLOAK_CLIENT_SECRET: z.string().min(1),

    BACK_OFFICE_BASE_URL: z.url(),
    BACK_OFFICE_API_BASE_URL: z.url(),
    BACK_OFFICE_KEYCLOAK_CLIENT_SECRET: z.string().min(1),

    /** Sans slash final ; chaque front y a son realm, `/realms/<realm>`. */
    KEYCLOAK_URL: z.url(),
    KEYCLOAK_CLIENT_ID: z.string().min(1),
    /** Transmis en `kc_idp_hint`. */
    KEYCLOAK_FRANCECONNECT_ALIAS: z.string().min(1).default("franceconnect"),

    COOKIE_ENCRYPTION_KEY: z
      .base64()
      .refine((value) => Buffer.from(value, "base64").length === COOKIE_ENCRYPTION_KEY_BYTES, {
        message: "32 octets encodés en base64 attendus (openssl rand -base64 32)",
      }),

    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),

    DATABASE_URL: z.url(),
  })
  // Deux fronts sur le même hôte seraient indiscernables, et une API servie
  // ailleurs que sur l'origine de son front ne recevrait pas ses cookies.
  .superRefine((env, context) => {
    if (new URL(env.FRONT_OFFICE_BASE_URL).host === new URL(env.BACK_OFFICE_BASE_URL).host) {
      context.addIssue({
        code: "custom",
        path: ["BACK_OFFICE_BASE_URL"],
        message: "même hôte que FRONT_OFFICE_BASE_URL : l'API ne saurait plus les distinguer",
      });
    }

    for (const [frontKey, apiKey] of FRONT_URL_KEYS) {
      if (new URL(env[frontKey]).origin !== new URL(env[apiKey]).origin) {
        context.addIssue({
          code: "custom",
          path: [apiKey],
          message: `origine différente de ${frontKey} : chaque front relaie lui-même /api`,
        });
      }
    }
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
