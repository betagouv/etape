import type { ConfigService } from "@nestjs/config";

import type { Env } from "../config/env.js";

/**
 * Les apps qui parlent à l'API. Chacune a son origine, relaie elle-même `/api`
 * vers l'API, et s'appuie sur son propre realm Keycloak.
 */
export const FRONT = {
  FRONT_OFFICE: "front-office",
  BACK_OFFICE: "back-office",
} as const;

export type Front = (typeof FRONT)[keyof typeof FRONT];

/**
 * Deux realms et non deux clients d'un même realm : la session de Keycloak est
 * commune à tout un realm, et un compte du front-office se retrouverait
 * connecté au back-office sans rien saisir.
 */
export const KEYCLOAK_REALM_BY_FRONT: Record<Front, string> = {
  [FRONT.FRONT_OFFICE]: "etape",
  [FRONT.BACK_OFFICE]: "etape-back-office",
};

export interface FrontConfig {
  /** Sans slash final : destination de fin de parcours. */
  frontBaseUrl: string;
  /** Préfixe `/api` inclus : la `redirect_uri` en dérive, au caractère près. */
  apiBaseUrl: string;
  keycloakIssuerUrl: string;
  keycloakClientSecret: string;
}

/** Jeton d'injection de la configuration des fronts (`Record<Front, FrontConfig>`). */
export const FRONT_CONFIGS = "FRONT_CONFIGS";

export function buildFrontConfigs(config: ConfigService<Env, true>): Record<Front, FrontConfig> {
  const keycloakUrl = config.get("KEYCLOAK_URL", { infer: true });

  return {
    [FRONT.FRONT_OFFICE]: {
      frontBaseUrl: config.get("FRONT_OFFICE_BASE_URL", { infer: true }),
      apiBaseUrl: config.get("FRONT_OFFICE_API_BASE_URL", { infer: true }),
      keycloakIssuerUrl: buildIssuerUrl(keycloakUrl, FRONT.FRONT_OFFICE),
      keycloakClientSecret: config.get("FRONT_OFFICE_KEYCLOAK_CLIENT_SECRET", { infer: true }),
    },
    [FRONT.BACK_OFFICE]: {
      frontBaseUrl: config.get("BACK_OFFICE_BASE_URL", { infer: true }),
      apiBaseUrl: config.get("BACK_OFFICE_API_BASE_URL", { infer: true }),
      keycloakIssuerUrl: buildIssuerUrl(keycloakUrl, FRONT.BACK_OFFICE),
      keycloakClientSecret: config.get("BACK_OFFICE_KEYCLOAK_CLIENT_SECRET", { infer: true }),
    },
  };
}

function buildIssuerUrl(keycloakUrl: string, front: Front): string {
  return `${keycloakUrl}/realms/${KEYCLOAK_REALM_BY_FRONT[front]}`;
}

/**
 * Reconnaît le front à l'en-tête `Host`, comparé à la liste fermée des fronts
 * configurés. Un hôte inconnu donne `null`, et la requête est refusée.
 *
 * `Host` et non `X-Forwarded-Host` : le nginx de chaque front écrit lui-même
 * `Host`, du nom qui lui a servi à choisir son bloc `server`, et le proxy de
 * Vite le transmet tel quel en local. `X-Forwarded-Host`, que `req.host` lit dès
 * que `trust proxy` est actif, garderait la valeur la plus à gauche — celle du
 * client si un proxy ajoute au lieu de remplacer. Aucune URL n'est jamais
 * construite à partir de l'en-tête : il ne sert qu'à choisir dans la liste.
 */
export function resolveFrontByHost(
  host: string | undefined,
  fronts: Record<Front, FrontConfig>,
): Front | null {
  if (!host) return null;

  const normalizedHost = host.toLowerCase();
  const entries = Object.entries(fronts) as [Front, FrontConfig][];
  const match = entries.find(([, config]) => new URL(config.frontBaseUrl).host === normalizedHost);

  return match ? match[0] : null;
}
