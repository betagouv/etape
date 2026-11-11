import { RequestMethod, UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import { GUARDS_METADATA, METHOD_METADATA } from "@nestjs/common/constants.js";
import type { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AccountService } from "../account/account.service.js";
import { NODE_ENV, type Env } from "../config/env.js";
import { AuthController } from "./auth.controller.js";
import type { FrontRequest } from "./front.guard.js";
import { FRONT, type Front, type FrontConfig } from "./front.js";
import type { OidcService } from "./oidc.service.js";
import { SESSION_POLICY_BY_FRONT } from "./session/session-policy.js";
import { SessionGuard, type AuthenticatedRequest } from "./session/session.guard.js";
import { FakeSessionRepository } from "./session/session.repository.fake.js";
import { SessionService } from "./session/session.service.js";

// Sans `supertest` : les routes de session sont vérifiées par ce qu'elles
// déclarent (méthode, gardes), puis en chaînant les vraies pièces — garde,
// service, contrôleur — sur le faux repository.

const MINUTE_MS = 60 * 1000;
const SESSION_ID = "5f0c8a52-6f0e-4f7a-9a39-1f1b8a6f2c11";
// Le service est créé en développement : noms sans préfixe.
const SESSION_COOKIE = "etape-front-office.sid";
const { idleTimeoutMs, maxDurationMs } = SESSION_POLICY_BY_FRONT[FRONT.FRONT_OFFICE];

const reflector = new Reflector();

/** Les gardes posées sur la route, et sur le contrôleur entier. */
function guardsOf(handler: (...args: never[]) => unknown): unknown[] {
  return reflector.getAllAndMerge<unknown[]>(GUARDS_METADATA, [handler, AuthController]);
}

function createRequest(cookies: Record<string, string>): FrontRequest {
  return { cookies, front: FRONT.FRONT_OFFICE } as unknown as FrontRequest;
}

function createContext(request: FrontRequest): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

describe("AuthController, routes de session", () => {
  let repository: FakeSessionRepository;
  let controller: AuthController;
  let guard: SessionGuard;

  beforeEach(() => {
    vi.useFakeTimers({ now: 0 });
    repository = new FakeSessionRepository();

    const values: Partial<Env> = {
      COOKIE_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
      NODE_ENV: NODE_ENV.DEVELOPMENT,
      KEYCLOAK_FRANCECONNECT_ALIAS: "franceconnect",
    };
    const config = { get: (name: keyof Env) => values[name] } as unknown as ConfigService<
      Env,
      true
    >;
    const sessions = new SessionService(repository, config);

    // Le parcours de connexion n'est pas en jeu : ni Keycloak ni comptes.
    controller = new AuthController(
      {} as OidcService,
      sessions,
      {} as AccountService,
      config,
      {} as Record<Front, FrontConfig>,
    );
    guard = new SessionGuard(sessions);

    // Ouverte à l'instant 0, comme le ferait le callback.
    repository.sessions.set(SESSION_ID, {
      accountId: "account",
      front: FRONT.FRONT_OFFICE,
      identityProvider: "local",
      claims: {},
      idToken: "id-token",
      expiresAt: maxDurationMs,
      idleExpiresAt: idleTimeoutMs,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("GET /auth/session", () => {
    // Le front relit l'échéance avant d'avertir et avant d'expirer : si la
    // lecture prolongeait, la session ne finirait jamais tant qu'un onglet est
    // ouvert.
    it("ne passe pas par SessionGuard, qui compterait la lecture comme une activité", () => {
      expect(guardsOf(AuthController.prototype.session)).not.toContain(SessionGuard);
    });

    it("rend la session sans repousser sa fin d'inactivité", async () => {
      vi.advanceTimersByTime(5 * MINUTE_MS);

      const response = await controller.session(
        FRONT.FRONT_OFFICE,
        createRequest({ [SESSION_COOKIE]: SESSION_ID }),
      );

      expect(response.session?.expiry.idleRemainingMs).toBe(idleTimeoutMs - 5 * MINUTE_MS);
      expect(repository.sessions.get(SESSION_ID)?.idleExpiresAt).toBe(idleTimeoutMs);
    });
  });

  describe("POST /auth/session/refresh", () => {
    it("est un POST, donc soumis à la garde CSRF globale, et exige une session", () => {
      expect(reflector.get(METHOD_METADATA, AuthController.prototype.refreshSession)).toBe(
        RequestMethod.POST,
      );
      expect(guardsOf(AuthController.prototype.refreshSession)).toContain(SessionGuard);
    });

    it("refuse une requête sans session, ou dont la session a expiré (401)", async () => {
      await expect(guard.canActivate(createContext(createRequest({})))).rejects.toThrow(
        UnauthorizedException,
      );

      vi.advanceTimersByTime(idleTimeoutMs);
      await expect(
        guard.canActivate(createContext(createRequest({ [SESSION_COOKIE]: SESSION_ID }))),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("repousse la fin d'inactivité, jamais la durée maximale", async () => {
      vi.advanceTimersByTime(5 * MINUTE_MS);
      const request = createRequest({ [SESSION_COOKIE]: SESSION_ID });

      await guard.canActivate(createContext(request));
      // `SessionGuard` vient d'y rattacher la session prolongée.
      const { session } = controller.refreshSession(request as unknown as AuthenticatedRequest);

      expect(session.expiry.idleRemainingMs).toBe(idleTimeoutMs);
      expect(session.expiry.maxRemainingMs).toBe(maxDurationMs - 5 * MINUTE_MS);
    });
  });
});
