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
