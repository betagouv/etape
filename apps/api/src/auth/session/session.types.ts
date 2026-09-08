/**
 * État retenu entre le départ vers Keycloak et le retour sur `/callback`. Hors
 * de la session utilisateur : elle précède toute authentification.
 */
export interface LoginTransaction {
  /** Anti-CSRF, comparé au `state` renvoyé par Keycloak. */
  state: string;
  /** Lie l'`id_token` à cette transaction précise (rejeu). */
  nonce: string;
  /** PKCE : seul son challenge a transité par le navigateur. */
  codeVerifier: string;
  /** Chemin interne, validé. */
  returnTo: string;
  expiresAt: number;
}

export interface UserSession {
  /** `sub` Keycloak. Lu sur le compte lié, dont il est la clé de jointure. */
  sub: string;
  /**
   * Identifiant **applicatif**, celui que porteront les dossiers. Rattaché ici
   * pour que `SessionGuard` le livre à toute route future sans requête de plus.
   */
  utilisateurId: string;
  /** Lu sur le compte lié, où il est rafraîchi à chaque connexion. */
  email?: string;
  /**
   * Alias du fournisseur d'identité de cette connexion, ou `local`. Propriété de
   * la session et non de la personne : le même compte peut se connecter par
   * FranceConnect une fois et par mot de passe la suivante.
   */
  fournisseurIdentite: string;
  /** Non typée : les champs varient d'un fournisseur d'identité à l'autre. */
  claims: Record<string, unknown>;
  /** Gardé pour le seul `id_token_hint` de la déconnexion. */
  idToken: string;
  expiresAt: number;
}

/**
 * Ce qui est réellement écrit à l'ouverture. `sub` et `email` n'en font pas
 * partie : ils appartiennent au compte lié, et les recopier ici en ferait deux
 * versions qui divergeraient dès la première mise à jour du profil.
 */
export type SessionAOuvrir = Omit<UserSession, "sub" | "email">;

/** Vue exposée au front. Aucun jeton n'en fait partie. */
export interface PublicSession {
  sub: string;
  email?: string;
  viaFranceConnect: boolean;
  claims: Record<string, unknown>;
}

/**
 * Le front reçoit un booléen et non l'alias : il affiche un badge, et n'a pas à
 * connaître le vocabulaire des fournisseurs. `PublicSession` reste ainsi
 * inchangée pour lui, alias ajoutés compris.
 */
export function toPublicSession(session: UserSession, aliasFranceConnect: string): PublicSession {
  return {
    sub: session.sub,
    email: session.email,
    viaFranceConnect: session.fournisseurIdentite === aliasFranceConnect,
    claims: session.claims,
  };
}
