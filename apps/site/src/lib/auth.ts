/**
 * Points d'entrée de l'authentification.
 *
 * Le site est un export statique : il ne parle jamais à Keycloak et ne détient
 * aucun secret. Se connecter revient à quitter le site pour `apps/api`, qui est
 * le client OIDC — voir `docs/authentification.md`.
 */

// Sans valeur de repli : une URL absente doit produire un lien manifestement
// cassé plutôt qu'un chemin d'apparence valide, comme pour `SIMULATEUR_URL`.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** `trailingSlash` oblige. */
export const COMPTE_PATH = "/compte/";

export const LOGIN_URL = `${API_BASE_URL}/auth/login`;

// `idp=franceconnect` court-circuite l'écran de Keycloak : c'est ce qui permet
// au front de rendre lui-même le bouton FranceConnect, seul endroit où l'on
// maîtrise sa conformité au kit imposé.
export const FRANCE_CONNECT_LOGIN_URL = `${LOGIN_URL}?idp=franceconnect`;

/** Ferme la session et propage la déconnexion à Keycloak, puis au fournisseur. */
export const LOGOUT_URL = `${API_BASE_URL}/auth/logout`;

/** URL interrogée pour connaître l'état de connexion. 401 si personne. */
export const SESSION_URL = `${API_BASE_URL}/auth/session`;

/**
 * Ajoute à une URL de connexion la page où revenir ensuite.
 *
 * L'API n'accepte que des chemins internes — une URL absolue y serait refusée,
 * pour ne pas faire de `/auth/login` une redirection ouverte.
 */
export function avecRetour(urlDeConnexion: string, chemin: string): string {
  const separateur = urlDeConnexion.includes("?") ? "&" : "?";
  return `${urlDeConnexion}${separateur}returnTo=${encodeURIComponent(chemin)}`;
}

/** Ce que l'API expose d'une session. Aucun jeton n'en fait partie. */
export interface SessionPublique {
  sub: string;
  email?: string;
  viaFranceConnect: boolean;
  /** Non typé : les champs varient selon le fournisseur d'identité. */
  claims: Record<string, unknown>;
}
