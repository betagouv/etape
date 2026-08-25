import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as client from "openid-client";

import type { Env } from "../config/env.js";

/**
 * Niveau de garantie eIDAS exigé par FranceConnect sur la requête d'autorisation.
 *
 * Le broker OIDC générique de Keycloak ne sait pas produire ce paramètre : son
 * champ de configuration `acrValues` est enregistré mais jamais émis (vérifié).
 * La parade tient en deux morceaux — l'API l'envoie ici, et l'identity provider
 * porte `forwardParameters: "acr_values"` pour le relayer jusqu'à FranceConnect.
 * Retirer l'un des deux fait silencieusement retomber les requêtes sans niveau
 * de garantie, que FranceConnect rejette.
 *
 * `eidas1` correspond à FranceConnect ; FranceConnect+ demanderait un niveau
 * supérieur.
 */
const FRANCECONNECT_ACR_VALUES = "eidas1";

/**
 * Client OIDC de l'API vis-à-vis de **Keycloak**.
 *
 * FranceConnect n'apparaît nulle part dans ce fichier, et c'est voulu : Keycloak
 * le broker. L'API ne parle qu'à un fournisseur standard, et le choix de
 * l'identité (FranceConnect ou compte local) se réduit à un paramètre
 * `kc_idp_hint`. Le jour où un second fournisseur s'ajoute — ProConnect pour des
 * conseillers, par exemple — rien ne bouge ici.
 */
@Injectable()
export class OidcService {
  private readonly logger = new Logger(OidcService.name);
  private discovery: Promise<client.Configuration> | null = null;

  constructor(private readonly config: ConfigService<Env, true>) {}

  /**
   * Récupère la configuration du realm, mise en cache après le premier succès.
   *
   * Découverte paresseuse plutôt qu'au démarrage : l'API et Keycloak démarrent
   * en parallèle, et faire dépendre le boot de l'un de la disponibilité de
   * l'autre transforme un simple décalage d'ordonnancement en panne.
   */
  private async getConfiguration(): Promise<client.Configuration> {
    // `openid-client` refuse tout issuer en clair, ce qui est le bon défaut : le
    // secret et les jetons y transitent. Le Keycloak de développement écoutant en
    // HTTP sur localhost, la contrainte est levée pour ce seul cas.
    //
    // Le test porte sur `development` et non sur « différent de production » : une
    // recette lancée par erreur en `NODE_ENV=staging` doit échouer bruyamment
    // plutôt que d'accepter silencieusement un échange de jetons non chiffré.
    const enDeveloppement = this.config.get("NODE_ENV", { infer: true }) === "development";

    this.discovery ??= client
      .discovery(
        new URL(this.config.get("KEYCLOAK_ISSUER_URL", { infer: true })),
        this.config.get("KEYCLOAK_CLIENT_ID", { infer: true }),
        this.config.get("KEYCLOAK_CLIENT_SECRET", { infer: true }),
        undefined,
        enDeveloppement ? { execute: [client.allowInsecureRequests] } : undefined,
      )
      .catch((error: unknown) => {
        // Sans cette remise à zéro, un Keycloak indisponible au premier appel
        // resterait en échec définitivement : la promesse rejetée serait servie
        // en cache à toutes les requêtes suivantes.
        this.discovery = null;
        this.logger.error("Découverte OIDC impossible auprès de Keycloak", error);
        throw new ServiceUnavailableException("Le fournisseur d'identité est injoignable.");
      });

    return this.discovery;
  }

  /** `redirect_uri` du client, qui doit correspondre au caractère près à celle du realm. */
  private get redirectUri(): string {
    return `${this.config.get("API_BASE_URL", { infer: true })}/auth/callback`;
  }

  /**
   * Construit l'URL d'autorisation.
   *
   * `idpHint` court-circuite l'écran de connexion de Keycloak et envoie
   * directement vers le fournisseur voulu. C'est ce qui permet au bouton
   * FranceConnect de vivre dans le front, seul endroit où sa conformité au kit
   * UX imposé est réellement maîtrisable.
   */
  async buildAuthorizationUrl(params: {
    state: string;
    nonce: string;
    codeChallenge: string;
    idpHint?: string;
  }): Promise<URL> {
    const configuration = await this.getConfiguration();

    return client.buildAuthorizationUrl(configuration, {
      redirect_uri: this.redirectUri,
      scope: "openid profile email",
      state: params.state,
      nonce: params.nonce,
      code_challenge: params.codeChallenge,
      code_challenge_method: "S256",
      ...(params.idpHint
        ? { kc_idp_hint: params.idpHint, acr_values: FRANCECONNECT_ACR_VALUES }
        : {}),
    });
  }

  /**
   * Échange le code contre les jetons.
   *
   * `expectedState` et `expectedNonce` ne sont pas décoratifs : la lib rejette
   * la réponse si l'un ne correspond pas, ce qui ferme le CSRF sur le callback
   * et le rejeu d'`id_token`.
   */
  async exchangeCode(params: {
    currentUrl: URL;
    state: string;
    nonce: string;
    codeVerifier: string;
  }) {
    const configuration = await this.getConfiguration();

    return client.authorizationCodeGrant(configuration, params.currentUrl, {
      expectedState: params.state,
      expectedNonce: params.nonce,
      pkceCodeVerifier: params.codeVerifier,
    });
  }

  /**
   * URL de déconnexion côté Keycloak.
   *
   * Maillon central d'une chaîne à trois : la session de l'API est détruite, la
   * session Keycloak l'est ici, et Keycloak propage vers FranceConnect si
   * l'identité en venait. FranceConnect impose cette propagation et la vérifie à
   * l'homologation — d'où la conservation de l'`id_token` en session, sans quoi
   * ce `id_token_hint` serait impossible à fournir.
   */
  async buildLogoutUrl(params: { idToken: string; postLogoutRedirectUri: string }): Promise<URL> {
    const configuration = await this.getConfiguration();

    return client.buildEndSessionUrl(configuration, {
      id_token_hint: params.idToken,
      post_logout_redirect_uri: params.postLogoutRedirectUri,
    });
  }
}
