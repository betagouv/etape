/**
 * Claims de plomberie du protocole, écartés de ce qui est exposé au front ; tout
 * le reste est de l'identité. Liste en négatif à dessein : FranceConnect renvoie
 * des champs qui varient d'un fournisseur à l'autre, et une liste blanche en
 * perdrait en silence.
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
  // Exposé à part, sur `PublicSession.sub`.
  "sub",
]);

/** Retient d'un `id_token` ce qui décrit la personne. Sert la page `/compte/`. */
export function identityClaims(claims: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(claims).filter(
      ([nom, valeur]) => !CLAIMS_DE_PROTOCOLE.has(nom) && valeur !== undefined && valeur !== null,
    ),
  );
}
