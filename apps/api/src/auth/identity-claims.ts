/**
 * Plomberie du protocole, écartée de ce qui est exposé au front. Liste en
 * négatif à dessein : les champs varient d'un fournisseur d'identité à l'autre,
 * et une liste blanche en perdrait en silence.
 */
const CLAIMS_DE_PROTOCOLE = new Set([
  "iss",
  "aud",
  "exp",
  "iat",
  "auth_time",
  "jti",
  "typ",
  "azp",
  "nonce",
  "sid",
  "at_hash",
  "c_hash",
  "s_hash",
  "session_state",
  "scope",
  "allowed-origins",
  "realm_access",
  "resource_access",
  "sub", // exposé à part, sur `PublicSession.sub`
]);

/** Retient d'un `id_token` ce qui décrit la personne. */
export function identityClaims(claims: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(claims).filter(
      ([nom, valeur]) => !CLAIMS_DE_PROTOCOLE.has(nom) && valeur !== undefined && valeur !== null,
    ),
  );
}
