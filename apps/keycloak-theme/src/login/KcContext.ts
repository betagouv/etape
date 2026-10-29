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
 * « Créer mon espace », en haut à droite de chaque maquette : Keycloak pose ces
 * deux champs sur toutes les pages, Keycloakify ne les type que sur la connexion.
 */
type RegistrationLink = {
  realm: { registrationAllowed?: boolean };
  url: { registrationUrl?: string };
};

export type KcContextExtensionPerPage = {
  "error.ftl": { url: { loginResetCredentialsUrl?: string } };
  "register.ftl": { altchaChallenge?: string; altchaUnavailable?: boolean };
  "login-update-password.ftl": RegistrationLink & { username?: string };
  "login-reset-password.ftl": RegistrationLink & {
    altchaChallenge?: string;
    altchaUnavailable?: boolean;
    login?: { username?: string };
    etapeResetLinkSent?: boolean;
    etapeResetLinkResent?: boolean;
    etapeResetLinkLifespanMinutes?: number;
    etapeResendDelaySeconds?: number;
  };
};

export type KcContext = ExtendKcContext<KcContextExtension, KcContextExtensionPerPage>;
