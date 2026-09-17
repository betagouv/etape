import { Controller, Get, Logger, Query, Req, Res, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { minutes, Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import * as client from "openid-client";

import { AccountService } from "../account/account.service.js";
import type { Env } from "../config/env.js";
import { extractIdentityClaims, getStringClaim } from "./identity-claims.js";
import { getIdentityProvider } from "./identity-provider.js";
import { OidcService } from "./oidc.service.js";
import { sanitizeReturnTo } from "./return-to.js";
import { SessionService } from "./session/session.service.js";
import { toPublicSession, type PublicSession } from "./session/session.types.js";

const AUTH_FLOW_THROTTLE = { default: { ttl: minutes(1), limit: 30 } };

/**
 * Les quatre points d'entrée du parcours. Le front n'en connaît pas davantage :
 * il ne voit jamais un jeton et ne parle jamais à Keycloak.
 */
@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly oidc: OidcService,
    private readonly sessions: SessionService,
    private readonly accountService: AccountService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  private get frontBaseUrl(): string {
    return this.config.get("FRONT_BASE_URL", { infer: true });
  }

  @Get("login")
  @Throttle(AUTH_FLOW_THROTTLE)
  async login(
    @Query("idp") idp: string | undefined,
    @Query("returnTo") returnTo: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const state = client.randomState();
    const nonce = client.randomNonce();
    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);

    const franceConnectAlias = this.config.get("KEYCLOAK_FRANCECONNECT_ALIAS", { infer: true });

    const authorizationUrl = await this.oidc.buildAuthorizationUrl({
      state,
      nonce,
      codeChallenge,
      idpHint: idp === "franceconnect" ? franceConnectAlias : undefined,
    });

    this.sessions.startTransaction(response, {
      state,
      nonce,
      codeVerifier,
      returnTo: sanitizeReturnTo(returnTo),
    });

    response.redirect(authorizationUrl.href);
  }

  /**
   * Aucune erreur n'est renvoyée telle quelle au navigateur : elles décrivent
   * l'état interne du fournisseur d'identité et restent dans les journaux.
   */
  @Get("callback")
  @Throttle(AUTH_FLOW_THROTTLE)
  async callback(@Req() request: Request, @Res() response: Response): Promise<void> {
    const transaction = this.sessions.consumeTransaction(request, response);

    if (!transaction) {
      response.redirect(`${this.frontBaseUrl}/?login=expired`);
      return;
    }

    const apiBaseUrl = this.config.get("API_BASE_URL", { infer: true });
    const currentUrl = new URL(request.originalUrl, apiBaseUrl);

    try {
      const tokens = await this.oidc.exchangeCode({
        currentUrl,
        state: transaction.state,
        nonce: transaction.nonce,
        codeVerifier: transaction.codeVerifier,
      });

      const claims = tokens.claims();
      if (!claims?.sub || !tokens.id_token) {
        throw new Error("Réponse du fournisseur d'identité sans `sub` ou sans `id_token`.");
      }

      const identityProvider = getIdentityProvider(claims);

      const account = await this.accountService.recordLogin({
        keycloakSub: claims.sub,
        email: getStringClaim(claims.email),
        prenom: getStringClaim(claims.given_name),
        nom: getStringClaim(claims.family_name),
        identityProvider,
      });

      await this.sessions.openSession(response, {
        accountId: account.id,
        identityProvider,
        claims: extractIdentityClaims(claims),
        idToken: tokens.id_token,
      });

      response.redirect(`${this.frontBaseUrl}${transaction.returnTo}`);
    } catch (error: unknown) {
      this.logger.error("Échec du retour d'authentification", error);
      response.redirect(`${this.frontBaseUrl}/?login=failed`);
    }
  }

  /**
   * Propagée en chaîne : s'arrêter à la session de l'API laisserait le
   * « Se connecter » suivant reconnecter silencieusement.
   */
  @Get("logout")
  async logout(@Req() request: Request, @Res() response: Response): Promise<void> {
    const session = await this.sessions.readSession(request);
    await this.sessions.closeSession(request, response);

    if (!session) {
      response.redirect(this.frontBaseUrl);
      return;
    }

    const logoutUrl = await this.oidc.buildLogoutUrl({
      idToken: session.idToken,
      postLogoutRedirectUri: this.frontBaseUrl,
    });

    response.redirect(logoutUrl.href);
  }

  @Get("session")
  async session(@Req() request: Request): Promise<PublicSession> {
    const session = await this.sessions.readSession(request);
    if (!session) throw new UnauthorizedException();

    return toPublicSession(
      session,
      this.config.get("KEYCLOAK_FRANCECONNECT_ALIAS", { infer: true }),
    );
  }
}
