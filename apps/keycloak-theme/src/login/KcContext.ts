import type { ExtendKcContext } from "keycloakify/login";

import type { KcEnvName } from "../kc.gen";

/**
 * Champs ajoutés au contexte que Keycloak injecte dans la page.
 *
 * `properties` porte les variables d'environnement déclarées dans
 * `vite.config.ts` (aucune pour l'instant) : c'est par là que passerait, par
 * exemple, l'URL du site à afficher dans un lien de retour.
 */
export type KcContextExtension = {
  properties: Record<KcEnvName, string>;
};

/** Champs ajoutés page par page. Aucun à ce jour. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type KcContextExtensionPerPage = {};

export type KcContext = ExtendKcContext<KcContextExtension, KcContextExtensionPerPage>;
