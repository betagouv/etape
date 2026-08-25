/** Destination par défaut si aucune n'est demandée ou si celle reçue est refusée. */
const DEFAULT_RETURN_TO = "/";

/**
 * Restreint la destination de retour à un chemin interne.
 *
 * Sans ce filtre, `?returnTo=https://exemple.test` fait de `/auth/login` une
 * redirection ouverte : un lien d'apparence légitime, pointant vers le vrai
 * domaine du service, qui dépose l'internaute sur un site tiers *après* une
 * connexion réussie. C'est le support classique de l'hameçonnage, et le fait que
 * la cible soit atteinte en fin de parcours authentifié le rend d'autant plus
 * crédible.
 *
 * Deux formes sont rejetées : les URL absolues (`https://…`, `//exemple.test`,
 * que le navigateur lit comme un changement d'origine) et les chemins qui ne
 * commencent pas par `/`.
 */
export function sanitizeReturnTo(raw: unknown): string {
  if (typeof raw !== "string" || raw.length === 0) return DEFAULT_RETURN_TO;

  // `//exemple.test` est relatif au protocole : c'est bien une autre origine.
  if (!raw.startsWith("/") || raw.startsWith("//")) return DEFAULT_RETURN_TO;

  // `\` est normalisé en `/` par plusieurs navigateurs : `/\exemple.test` est
  // donc une origine externe déguisée, que le test précédent laisse passer.
  if (raw.includes("\\")) return DEFAULT_RETURN_TO;

  return raw;
}
