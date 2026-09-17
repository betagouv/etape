/** Destination par défaut si aucune n'est demandée ou si celle reçue est refusée. */
const DEFAULT_RETURN_TO = "/";

/** Borne la taille du cookie de transaction, qui transporte cette valeur. */
export const MAX_RETURN_TO_LENGTH = 512;

/**
 * Restreint la destination de retour à un chemin interne.
 *
 * Sans ce filtre, `?returnTo=https://exemple.test` fait de `/auth/login` une
 * redirection ouverte : un lien pointant vers le vrai domaine du service, qui
 * dépose l'internaute sur un site tiers *après* une connexion réussie.
 */
export function sanitizeReturnTo(raw: unknown): string {
  if (typeof raw !== "string" || raw.length === 0) return DEFAULT_RETURN_TO;

  if (raw.length > MAX_RETURN_TO_LENGTH) return DEFAULT_RETURN_TO;

  // `//exemple.test` est relatif au protocole : c'est bien une autre origine.
  if (!raw.startsWith("/") || raw.startsWith("//")) return DEFAULT_RETURN_TO;

  // `\` est normalisé en `/` par plusieurs navigateurs : `/\exemple.test` est
  // donc une origine externe que le test précédent laisse passer.
  if (raw.includes("\\")) return DEFAULT_RETURN_TO;

  return raw;
}
