/**
 * État à retenir entre le départ vers Keycloak et le retour sur `/callback`.
 *
 * Hors de la session utilisateur : elle existe avant que quiconque soit
 * authentifié, et doit expirer vite.
 */
export interface LoginTransaction {
  /** Contrôle anti-CSRF, comparé au `state` renvoyé par Keycloak. */
  state: string;
  /** Lie l'`id_token` à cette transaction précise (rejeu). */
  nonce: string;
  /** PKCE : vérifieur dont seul le challenge a transité par le navigateur. */
  codeVerifier: string;
  /** Chemin du front où revenir après connexion, relatif et validé. */
  returnTo: string;
  expiresAt: number;
}

export interface UserSession {
  sub: string;
  email?: string;
  viaFranceConnect: boolean;
  /**
   * Identité reçue du fournisseur, débarrassée de la plomberie du protocole.
   * Conservée telle quelle : les champs varient d'un fournisseur à l'autre, et
   * l'objet de la recette est justement de voir ce qui arrive réellement.
   */
  claims: Record<string, unknown>;
  /**
   * Conservé pour une seule raison : il est exigé comme `id_token_hint` à la
   * déconnexion, dont FranceConnect impose la propagation.
   */
  idToken: string;
  expiresAt: number;
}

/** Vue exposée au front. Aucun jeton : le navigateur sait *qui*, jamais *avec quoi*. */
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
