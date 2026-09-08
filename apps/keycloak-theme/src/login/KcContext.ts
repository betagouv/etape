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

/**
 * Champs ajoutés page par page.
 *
 * Keycloak place `loginResetCredentialsUrl` sur toutes ses pages, y compris
 * `error.ftl` où atterrit un lien de réinitialisation expiré — vérifié sur
 * Keycloak 26.7. Keycloakify ne le déclare que sur les pages de connexion, si
 * bien que la seule porte de sortie utile de cette page-là est invisible au
 * typage. Facultatif malgré tout : le contexte est fourni par le serveur, et
 * une version ultérieure pourrait cesser de le poser.
 */
export type KcContextExtensionPerPage = {
  "error.ftl": { url: { loginResetCredentialsUrl?: string } };
};

export type KcContext = ExtendKcContext<KcContextExtension, KcContextExtensionPerPage>;
