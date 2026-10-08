import type { PublicSession, SessionResponse } from "@etape/api-contract";

/**
 * État retenu entre le départ vers Keycloak et le retour sur `/callback`. Hors
 * de la session du compte : elle précède toute authentification.
 */
export interface PendingLogin {
  /** Anti-CSRF, comparé au `state` renvoyé par Keycloak. */
  state: string;
  /** Lie l'`id_token` à cette transaction précise (rejeu). */
  nonce: string;
  /** PKCE : chiffré dans le cookie, seul son challenge part vers Keycloak. */
  codeVerifier: string;
  /** Chemin interne, validé. */
  returnTo: string;
  expiresAt: number;
}

export interface AccountSession {
  sub: string;
  accountId: string;
  email?: string;
  identityProvider: string;
  /** Non typée : les champs varient d'un fournisseur d'identité à l'autre. */
  claims: Record<string, unknown>;
  /** Gardé pour le seul `id_token_hint` de la déconnexion. */
  idToken: string;
  expiresAt: number;
}

export type NewSession = Omit<AccountSession, "sub" | "email">;

export function toPublicSession(
  session: AccountSession,
  franceConnectAlias: string,
): PublicSession {
  return {
    sub: session.sub,
    email: session.email,
    isFranceConnectSession: session.identityProvider === franceConnectAlias,
    claims: session.claims,
  };
}

/** `null` = personne n'est connecté : une réponse, pas une erreur. */
export function toSessionResponse(
  session: AccountSession | null,
  franceConnectAlias: string,
): SessionResponse {
  return { session: session ? toPublicSession(session, franceConnectAlias) : null };
}
