import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as client from "openid-client";

import type { Env } from "../config/env.js";

/**
 * Client OIDC vis-à-vis de **Keycloak**. FranceConnect n'apparaît pas ici : c'est
 * Keycloak qui le broker, et le choix de l'identité tient dans `kc_idp_hint`.
 */
@Injectable()
export class OidcService {
  private readonly logger = new Logger(OidcService.name);
  private discovery: Promise<client.Configuration> | null = null;

  constructor(private readonly config: ConfigService<Env, true>) {}

  /** Découverte paresseuse : l'API et Keycloak démarrent en parallèle. */
  private async getConfiguration(): Promise<client.Configuration> {
    // `development` et non « différent de production » : un `NODE_ENV=staging`
    // lancé par erreur doit échouer plutôt qu'accepter du non chiffré.
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
        // Sans cette remise à zéro, la promesse rejetée serait servie en cache
        // à toutes les requêtes suivantes.
        this.discovery = null;
        this.logger.error("Découverte OIDC impossible auprès de Keycloak", error);
        throw new ServiceUnavailableException("Le fournisseur d'identité est injoignable.");
      });

    return this.discovery;
  }

  /** Doit correspondre au caractère près à celle déclarée dans le realm. */
  private get redirectUri(): string {
    return `${this.config.get("API_BASE_URL", { infer: true })}/auth/callback`;
  }

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
   * `expectedState` et `expectedNonce` ne sont pas décoratifs : ils ferment le
   * CSRF sur le callback et le rejeu d'`id_token`.
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
   * Keycloak propage vers FranceConnect, qui vérifie cette propagation à
   * l'homologation — d'où l'`id_token` gardé en session.
   */
  async buildLogoutUrl(params: { idToken: string; postLogoutRedirectUri: string }): Promise<URL> {
    const configuration = await this.getConfiguration();

    return client.buildEndSessionUrl(configuration, {
      id_token_hint: params.idToken,
      post_logout_redirect_uri: params.postLogoutRedirectUri,
    });
  }
}
