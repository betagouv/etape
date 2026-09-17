/**
 * Le site est un export statique sans secret : se connecter revient à le quitter
 * pour `apps/api`, qui est le client OIDC — voir `docs/authentification.md`.
 */

// Sans repli : une URL absente doit produire un lien manifestement cassé plutôt
// qu'un chemin d'apparence valide.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** `trailingSlash` oblige. */
export const ACCOUNT_PATH = "/compte/";

export const LOGIN_URL = `${API_BASE_URL}/auth/login`;
/** `idp=franceconnect` court-circuite l'écran de Keycloak. */
export const FRANCE_CONNECT_LOGIN_URL = `${LOGIN_URL}?idp=franceconnect`;
export const LOGOUT_URL = `${API_BASE_URL}/auth/logout`;
/** 401 si personne n'est connecté. */
export const SESSION_URL = `${API_BASE_URL}/auth/session`;

/** L'API n'accepte que des chemins internes. */
export function withReturnTo(loginUrl: string, path: string): string {
  const separator = loginUrl.includes("?") ? "&" : "?";
  return `${loginUrl}${separator}returnTo=${encodeURIComponent(path)}`;
}

export const AUTH_FLOW_STEP = {
  LOGIN: "login",
  LOGOUT: "logout",
} as const;

export type AuthFlowStep = (typeof AUTH_FLOW_STEP)[keyof typeof AUTH_FLOW_STEP];

export const AUTH_FLOW_ERROR = {
  EXPIRED: "expired",
  FAILED: "failed",
  UNAVAILABLE: "unavailable",
  TOO_MANY_REQUESTS: "too-many-requests",
} as const;

export type AuthFlowError = (typeof AUTH_FLOW_ERROR)[keyof typeof AUTH_FLOW_ERROR];

export function isAuthFlowError(value: string | null): value is AuthFlowError {
  return Object.values<string | null>(AUTH_FLOW_ERROR).includes(value);
}

/** Ce que l'API expose d'une session. Aucun jeton n'en fait partie. */
export interface PublicSession {
  sub: string;
  email?: string;
  isFranceConnectSession: boolean;
  /** Non typée : les champs varient selon le fournisseur d'identité. */
  claims: Record<string, unknown>;
}
