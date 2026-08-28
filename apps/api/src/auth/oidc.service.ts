import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as client from "openid-client";

import type { Env } from "../config/env.js";

/**
 * Client OIDC de l'API vis-à-vis de **Keycloak**.
 *
 * FranceConnect n'apparaît nulle part ici, et c'est voulu : Keycloak le broker,
 * l'API ne parle qu'à un fournisseur standard, et le choix de l'identité se
 * réduit à un `kc_idp_hint`. Ajouter ProConnect demain ne touche pas ce fichier.
 */
@Injectable()
export class OidcService {
  private readonly logger = new Logger(OidcService.name);
  private discovery: Promise<client.Configuration> | null = null;

  constructor(private readonly config: ConfigService<Env, true>) {}

  /**
   * Configuration du realm, mise en cache après le premier succès.
   *
   * Découverte paresseuse : l'API et Keycloak démarrent en parallèle, et faire
   * dépendre le boot de l'un de l'autre transforme un décalage d'ordonnancement
   * en panne.
   */
  private async getConfiguration(): Promise<client.Configuration> {
    // `openid-client` refuse tout issuer en clair — le secret et les jetons y
    // transitent — et la contrainte n'est levée que pour le Keycloak local.
    //
    // Le test porte sur `development` et non sur « différent de production » :
    // un `NODE_ENV=staging` lancé par erreur doit échouer bruyamment plutôt que
    // d'accepter un échange de jetons non chiffré.
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
        // Sans cette remise à zéro, la promesse rejetée serait servie en cache à
        // toutes les requêtes suivantes : un Keycloak indisponible au premier
        // appel le resterait définitivement.
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
   * `idpHint` court-circuite l'écran de Keycloak et envoie directement vers le
   * fournisseur voulu — ce qui permet au bouton FranceConnect de vivre dans le
   * front, seul endroit où sa conformité au kit imposé est maîtrisable.
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
      ...(params.idpHint ? { kc_idp_hint: params.idpHint } : {}),
    });
  }

  /**
   * `expectedState` et `expectedNonce` ne sont pas décoratifs : la lib rejette la
   * réponse si l'un ne correspond pas, ce qui ferme le CSRF sur le callback et le
   * rejeu d'`id_token`.
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
   * Maillon central d'une chaîne à trois : l'API détruit sa session, Keycloak la
   * sienne ici, et propage vers FranceConnect si l'identité en venait. Cette
   * propagation est vérifiée à l'homologation — d'où l'`id_token` gardé en
   * session, sans quoi l'`id_token_hint` serait impossible à fournir.
   */
  async buildLogoutUrl(params: { idToken: string; postLogoutRedirectUri: string }): Promise<URL> {
    const configuration = await this.getConfiguration();

    return client.buildEndSessionUrl(configuration, {
      id_token_hint: params.idToken,
      post_logout_redirect_uri: params.postLogoutRedirectUri,
    });
  }
}
