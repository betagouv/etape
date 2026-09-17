/**
 * Plomberie du protocole, écartée de ce qui est exposé au front. Liste en
 * négatif à dessein : les champs varient d'un fournisseur d'identité à l'autre,
 * et une liste blanche en perdrait en silence.
 */
const PROTOCOL_CLAIMS = new Set([
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
export function extractIdentityClaims(claims: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(claims).filter(
      ([name, value]) => !PROTOCOL_CLAIMS.has(name) && value !== undefined && value !== null,
    ),
  );
}

export function getStringClaim(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
