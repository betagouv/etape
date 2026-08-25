/**
 * Transaction de connexion : l'état à retenir entre le départ vers Keycloak et
 * le retour sur `/callback`.
 *
 * Volontairement hors de la session utilisateur : elle existe avant que
 * quiconque soit authentifié, et doit expirer vite.
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

/**
 * Session d'un utilisateur connecté.
 *
 * L'`idToken` est conservé pour une seule raison : il est exigé comme
 * `id_token_hint` à la déconnexion. FranceConnect impose la propagation du
 * logout et la vérifie à l'homologation — sans lui, la chaîne casse.
 */
export interface UserSession {
  sub: string;
  email?: string;
  /** `true` si l'identité vient de FranceConnect plutôt que d'un compte local. */
  viaFranceConnect: boolean;
  /**
   * Identité reçue du fournisseur, débarrassée de la plomberie du protocole.
   *
   * Conservée telle quelle plutôt que remodelée en type fermé : les champs que
   * renvoie FranceConnect varient selon le fournisseur d'identité, et l'objet
   * du parcours de recette est justement de voir ce qui arrive réellement.
   */
  claims: Record<string, unknown>;
  idToken: string;
  expiresAt: number;
}

/**
 * Vue exposée au front. Ne contient délibérément aucun jeton : le navigateur n'a
 * besoin de savoir que *qui* est connecté, jamais *avec quoi*.
 */
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
