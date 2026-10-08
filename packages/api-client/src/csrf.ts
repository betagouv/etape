// Copie de `apps/api/src/auth/csrf.guard.ts`, à garder alignée : l'API ne peut
// importer du contrat que des types (voir `auth-flow.ts`).

/**
 * En-tête fixe exigé par l'API sur les requêtes qui modifient des données. Une
 * page d'un autre site ne peut pas l'ajouter sans la permission du serveur, que
 * l'API ne donne jamais : elle n'active pas le CORS.
 */
export const CSRF_HEADER = "x-etape-csrf";
export const CSRF_HEADER_VALUE = "1";
