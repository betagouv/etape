/**
 * Découpage des chemins entre les deux apps — source unique de vérité.
 *
 * Le site est servi à la racine, le simulateur sous un préfixe. Ce découpage
 * doit être identique partout où il apparaît : le `basePath` du simulateur, le
 * lien du site vers le simulateur, et les règles de routage écrites dans
 * `.vercel/output/config.json` par `scripts/vercel-out.mjs`.
 *
 * Ces trois consommateurs vivent dans des contextes de build séparés (deux apps
 * Next et un script Node), d'où ce module racine plutôt qu'une constante
 * partagée par import direct.
 *
 * Fichier `.mjs` et non `.ts` : `scripts/vercel-out.mjs` tourne sous Node nu,
 * sans étape de compilation.
 */

/** Préfixe du simulateur, sans slash final (convention `basePath` de Next). */
export const SIMULATEUR_BASE_PATH = "/simulateur";
