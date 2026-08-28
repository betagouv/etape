import { Controller, Get, Logger, Query, Req, Res, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";
import * as client from "openid-client";

import type { Env } from "../config/env.js";
import { identityClaims } from "./identity-claims.js";
import { OidcService } from "./oidc.service.js";
import { sanitizeReturnTo } from "./return-to.js";
import { SessionService } from "./session/session.service.js";
import { toPublicSession, type PublicSession } from "./session/session.types.js";

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
    private readonly config: ConfigService<Env, true>,
  ) {}

  private get frontBaseUrl(): string {
    return this.config.get("FRONT_BASE_URL", { infer: true });
  }

  @Get("login")
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

    await this.sessions.startTransaction(response, {
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
  async callback(@Req() request: Request, @Res() response: Response): Promise<void> {
    const transaction = await this.sessions.consumeTransaction(request, response);

    if (!transaction) {
      response.redirect(`${this.frontBaseUrl}/?connexion=expiree`);
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

      await this.sessions.openSession(response, {
        sub: claims.sub,
        email: typeof claims.email === "string" ? claims.email : undefined,
        // Suppose le mapper `identity_provider` sur le client.
        viaFranceConnect:
          claims.identity_provider ===
          this.config.get("KEYCLOAK_FRANCECONNECT_ALIAS", { infer: true }),
        claims: identityClaims(claims),
        idToken: tokens.id_token,
      });

      response.redirect(`${this.frontBaseUrl}${transaction.returnTo}`);
    } catch (error: unknown) {
      this.logger.error("Échec de l'échange du code d'autorisation", error);
      response.redirect(`${this.frontBaseUrl}/?connexion=echec`);
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

    return toPublicSession(session);
  }
}
