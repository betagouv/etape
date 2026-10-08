import { Inject, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as client from "openid-client";

import { NODE_ENV, type Env } from "../config/env.js";
import { FRONT_CONFIGS, type Front, type FrontConfig } from "./front.js";

/**
 * Client OIDC vis-à-vis de **Keycloak**, un realm par front. FranceConnect
 * n'apparaît pas ici : c'est Keycloak qui le broker, et le choix de l'identité
 * tient dans `kc_idp_hint`.
 *
 * Chaque front a sa découverte, donc son émetteur : `openid-client` refuse un
 * `id_token` émis par l'autre realm, et un code obtenu sur le front-office ne
 * s'échange pas au callback du back-office.
 */
@Injectable()
export class OidcService {
  private readonly logger = new Logger(OidcService.name);
  private readonly discoveries = new Map<Front, Promise<client.Configuration>>();

  constructor(
    private readonly config: ConfigService<Env, true>,
    @Inject(FRONT_CONFIGS) private readonly fronts: Record<Front, FrontConfig>,
  ) {}

  /** Découverte paresseuse : l'API et Keycloak démarrent en parallèle. */
  private async getConfiguration(front: Front): Promise<client.Configuration> {
    const cached = this.discoveries.get(front);
    if (cached) return cached;

    // `development` et non « différent de production » : un `NODE_ENV=staging`
    // lancé par erreur doit échouer plutôt qu'accepter du non chiffré.
    const isDevelopment = this.config.get("NODE_ENV", { infer: true }) === NODE_ENV.DEVELOPMENT;
    const frontConfig = this.fronts[front];

    const discovery = client
      .discovery(
        new URL(frontConfig.keycloakIssuerUrl),
        this.config.get("KEYCLOAK_CLIENT_ID", { infer: true }),
        frontConfig.keycloakClientSecret,
        undefined,
        isDevelopment ? { execute: [client.allowInsecureRequests] } : undefined,
      )
      .catch((error: unknown) => {
        // Sans ce retrait, la promesse rejetée serait servie en cache à toutes
        // les requêtes suivantes.
        this.discoveries.delete(front);
        this.logger.error(`Découverte OIDC impossible auprès de Keycloak (${front})`, error);
        throw new ServiceUnavailableException("Le fournisseur d'identité est injoignable.");
      });

    this.discoveries.set(front, discovery);
    return discovery;
  }

  /** Doit correspondre au caractère près à celle déclarée dans le realm. */
  private getRedirectUri(front: Front): string {
    return `${this.fronts[front].apiBaseUrl}/auth/callback`;
  }

  async buildAuthorizationUrl(
    front: Front,
    params: {
      state: string;
      nonce: string;
      codeChallenge: string;
      idpHint?: string;
    },
  ): Promise<URL> {
    const configuration = await this.getConfiguration(front);

    return client.buildAuthorizationUrl(configuration, {
      redirect_uri: this.getRedirectUri(front),
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
  async exchangeCode(
    front: Front,
    params: {
      currentUrl: URL;
      state: string;
      nonce: string;
      codeVerifier: string;
    },
  ): Promise<client.TokenEndpointResponse & client.TokenEndpointResponseHelpers> {
    const configuration = await this.getConfiguration(front);

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
  async buildLogoutUrl(front: Front, idToken: string): Promise<URL> {
    const configuration = await this.getConfiguration(front);

    return client.buildEndSessionUrl(configuration, {
      id_token_hint: idToken,
      post_logout_redirect_uri: this.fronts[front].frontBaseUrl,
    });
  }
}
