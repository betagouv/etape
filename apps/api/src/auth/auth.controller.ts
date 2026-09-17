import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseFilters,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { minutes, Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import * as client from "openid-client";

import { AccountService } from "../account/account.service.js";
import type { Env } from "../config/env.js";
import { AUTH_FLOW_ERROR, AUTH_FLOW_STEP, buildAuthFlowErrorUrl } from "./auth-flow-error.js";
import { AuthFlowExceptionFilter } from "./auth-flow-exception.filter.js";
import { extractIdentityClaims, getStringClaim } from "./identity-claims.js";
import { getIdentityProvider } from "./identity-provider.js";
import { OidcService } from "./oidc.service.js";
import { sanitizeReturnTo } from "./return-to.js";
import { SessionService } from "./session/session.service.js";
import { toPublicSession, type PublicSession } from "./session/session.types.js";

const AUTH_FLOW_THROTTLE = { default: { ttl: minutes(1), limit: 30 } };

const FRANCECONNECT_IDP_HINT = "franceconnect";

/**
 * Les quatre points d'entrée du parcours. Le front n'en connaît pas davantage :
 * il ne voit jamais un jeton et ne parle jamais à Keycloak.
 */
@Controller("auth")
export class AuthController {
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
  @UseFilters(AuthFlowExceptionFilter)
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
      idpHint: idp === FRANCECONNECT_IDP_HINT ? franceConnectAlias : undefined,
    });

    this.sessions.startPendingLogin(response, {
      state,
      nonce,
      codeVerifier,
      returnTo: sanitizeReturnTo(returnTo),
    });

    response.redirect(authorizationUrl.href);
  }

  @Get("callback")
  @Throttle(AUTH_FLOW_THROTTLE)
  @UseFilters(AuthFlowExceptionFilter)
  async callback(@Req() request: Request, @Res() response: Response): Promise<void> {
    const pendingLogin = this.sessions.consumePendingLogin(request, response);

    if (!pendingLogin) {
      response.redirect(
        buildAuthFlowErrorUrl(this.frontBaseUrl, AUTH_FLOW_STEP.LOGIN, AUTH_FLOW_ERROR.EXPIRED),
      );
      return;
    }

    const apiBaseUrl = this.config.get("API_BASE_URL", { infer: true });
    const currentUrl = new URL(request.originalUrl, apiBaseUrl);

    const tokens = await this.oidc.exchangeCode({
      currentUrl,
      state: pendingLogin.state,
      nonce: pendingLogin.nonce,
      codeVerifier: pendingLogin.codeVerifier,
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

    await this.sessions.openSession(request, response, {
      accountId: account.id,
      identityProvider,
      claims: extractIdentityClaims(claims),
      idToken: tokens.id_token,
    });

    response.redirect(`${this.frontBaseUrl}${pendingLogin.returnTo}`);
  }

  /**
   * Propagée en chaîne : s'arrêter à la session de l'API laisserait le
   * « Se connecter » suivant reconnecter silencieusement.
   */
  @Get("logout")
  @UseFilters(AuthFlowExceptionFilter)
  async logout(@Req() request: Request, @Res() response: Response): Promise<void> {
    const session = await this.sessions.closeSession(request, response);

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
