/**
 * Points d'entrée de l'authentification.
 *
 * Le site est un export statique : il ne parle jamais à Keycloak et ne détient
 * aucun secret. Se connecter revient à quitter le site pour `apps/api`, qui est
 * le client OIDC — voir `docs/authentification.md`.
 */

/**
 * URL de l'API, préfixe `/api` inclus, figée au build par `next.config.ts`.
 *
 * Volontairement sans valeur de repli ici : une URL absente doit produire un
 * lien manifestement cassé plutôt qu'un chemin d'apparence valide, comme pour
 * `SIMULATEUR_URL`.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** Page qui rend compte de la session en cours. `trailingSlash` oblige. */
export const COMPTE_PATH = "/compte/";

/** Démarre la connexion : email/mot de passe ou FranceConnect, au choix. */
export const LOGIN_URL = `${API_BASE_URL}/auth/login`;

/**
 * Démarre la connexion directement chez FranceConnect.
 *
 * `idp=franceconnect` court-circuite l'écran de Keycloak : c'est ce qui permet
 * au front de rendre lui-même le bouton FranceConnect, seul endroit où l'on
 * maîtrise sa conformité au kit imposé.
 */
export const FRANCE_CONNECT_LOGIN_URL = `${LOGIN_URL}?idp=franceconnect`;

/** Ferme la session et propage la déconnexion à Keycloak, puis au fournisseur. */
export const LOGOUT_URL = `${API_BASE_URL}/auth/logout`;

/**
 * Ajoute à une URL de connexion la page où revenir ensuite.
 *
 * L'API n'accepte que des chemins internes — une URL absolue y serait refusée
 * et remplacée par la racine, pour ne pas faire de `/auth/login` une
 * redirection ouverte.
 */
export function avecRetour(urlDeConnexion: string, chemin: string): string {
  const separateur = urlDeConnexion.includes("?") ? "&" : "?";
  return `${urlDeConnexion}${separateur}returnTo=${encodeURIComponent(chemin)}`;
}

/** Ce que l'API expose d'une session. Aucun jeton n'en fait partie. */
export interface SessionPublique {
  sub: string;
  email?: string;
  /** `true` si l'identité vient de FranceConnect plutôt que d'un compte local. */
  viaFranceConnect: boolean;
  /**
   * Identité transmise par le fournisseur. Volontairement non typée : les
   * champs varient selon le fournisseur d'identité choisi dans FranceConnect.
   */
  claims: Record<string, unknown>;
}

/** URL interrogée pour connaître l'état de connexion. 401 si personne. */
export const SESSION_URL = `${API_BASE_URL}/auth/session`;
