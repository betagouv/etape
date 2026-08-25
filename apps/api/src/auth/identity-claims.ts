/**
 * Claims de plomberie du protocole, écartés de ce qui est exposé au front.
 *
 * Tout le reste est de l'identité : nom, prénom, date et lieu de naissance,
 * niveau de garantie, fournisseur d'origine. La liste est en négatif plutôt
 * qu'en positif à dessein — FranceConnect renvoie des champs qui varient selon
 * le fournisseur d'identité, et une liste blanche en perdrait en silence.
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

/**
 * Retient d'un `id_token` ce qui décrit la personne.
 *
 * Sert la page `/compte/`, qui affiche l'identité reçue pour vérifier de bout
 * en bout ce que FranceConnect transmet réellement.
 */
export function identityClaims(claims: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(claims).filter(
      ([nom, valeur]) => !CLAIMS_DE_PROTOCOLE.has(nom) && valeur !== undefined && valeur !== null,
    ),
  );
}
