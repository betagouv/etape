/**
 * Découpage des chemins entre les deux apps — source unique de vérité.
 *
 * Le site est servi à la racine, le simulateur sous un préfixe. Ce découpage
 * doit être identique partout où il apparaît : le `basePath` du simulateur, le
 * lien du site vers le simulateur, l'assemblage des deux exports par
 * `scripts/assemble-static.mjs`, et les règles de routage de la conf nginx
 * (`infra/nginx/previews.conf`, où le préfixe est recopié à la main : le seul
 * endroit qui ne peut pas importer ce module).
 *
 * Ces trois consommateurs vivent dans des contextes de build séparés (deux apps
 * Next et un script Node), d'où ce module racine plutôt qu'une constante
 * partagée par import direct.
 *
 * Fichier `.mjs` et non `.ts` : `scripts/assemble-static.mjs` tourne sous Node
 * nu, sans étape de compilation.
 */

/** Préfixe du simulateur, sans slash final (convention `basePath` de Next). */
export const SIMULATEUR_BASE_PATH = "/simulateur";
