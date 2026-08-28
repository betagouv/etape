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
  sub: string;
  email?: string;
  viaFranceConnect: boolean;
  /** Non typée : les champs varient d'un fournisseur d'identité à l'autre. */
  claims: Record<string, unknown>;
  /** Gardé pour le seul `id_token_hint` de la déconnexion. */
  idToken: string;
  expiresAt: number;
}

/** Vue exposée au front. Aucun jeton n'en fait partie. */
export interface PublicSession {
  sub: string;
  email?: string;
  viaFranceConnect: boolean;
  claims: Record<string, unknown>;
}

export function toPublicSession(session: UserSession): PublicSession {
  return {
    sub: session.sub,
    email: session.email,
    viaFranceConnect: session.viaFranceConnect,
    claims: session.claims,
  };
}
