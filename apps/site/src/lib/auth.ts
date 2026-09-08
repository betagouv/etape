/**
 * Le site est un export statique sans secret : se connecter revient à le quitter
 * pour `apps/api`, qui est le client OIDC — voir `docs/authentification.md`.
 */

// Sans repli : une URL absente doit produire un lien manifestement cassé plutôt
// qu'un chemin d'apparence valide.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** `trailingSlash` oblige. */
export const COMPTE_PATH = "/compte/";

export const LOGIN_URL = `${API_BASE_URL}/auth/login`;
/** `idp=franceconnect` court-circuite l'écran de Keycloak. */
export const FRANCE_CONNECT_LOGIN_URL = `${LOGIN_URL}?idp=franceconnect`;
export const LOGOUT_URL = `${API_BASE_URL}/auth/logout`;
/** 401 si personne n'est connecté. */
export const SESSION_URL = `${API_BASE_URL}/auth/session`;

/** L'API n'accepte que des chemins internes. */
export function avecRetour(urlDeConnexion: string, chemin: string): string {
  const separateur = urlDeConnexion.includes("?") ? "&" : "?";
  return `${urlDeConnexion}${separateur}returnTo=${encodeURIComponent(chemin)}`;
}

/** Ce que l'API expose d'une session. Aucun jeton n'en fait partie. */
export interface SessionPublique {
  sub: string;
  email?: string;
  viaFranceConnect: boolean;
  /** Non typée : les champs varient selon le fournisseur d'identité. */
  claims: Record<string, unknown>;
}
