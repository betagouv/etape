import { claimTexte } from "./identity-claims.js";

/**
 * Retenu quand aucun broker n'est intervenu : compte Keycloak local, email et
 * mot de passe. Ce n'est l'alias d'aucun fournisseur, d'où une valeur choisie
 * plutôt qu'un `null` — la colonne serait sinon vide pour la moitié des lignes,
 * et « inconnu » se confondrait avec « local ».
 */
export const FOURNISSEUR_LOCAL = "local";

/**
 * Par quel fournisseur d'identité cette connexion est passée.
 *
 * `identity_provider` est posé par un mapper du client `etape-api`, et n'existe
 * dans l'`id_token` que si un broker est intervenu : une connexion par mot de
 * passe n'a pas ce claim du tout, pas même vide. Son absence vaut donc « local ».
 *
 * L'alias est repris tel quel plutôt que traduit en énumération : ajouter
 * ProConnect pour des conseillers n'a alors besoin ni de migration ni de
 * modification ici, comme le promet `docs/authentification.md`.
 */
export function fournisseurIdentite(claims: Record<string, unknown>): string {
  return claimTexte(claims.identity_provider) ?? FOURNISSEUR_LOCAL;
}
