import type { ConfigService } from "@nestjs/config";
import type { CookieOptions, Request, Response } from "express";
import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NODE_ENV, type Env } from "../../config/env.js";
import { FRONT } from "../front.js";
import { MAX_RETURN_TO_LENGTH } from "../return-to.js";
import { sealCookieValue } from "./cookie-cipher.js";
import { SESSION_POLICY_BY_FRONT } from "./session-policy.js";
import { SessionService } from "./session.service.js";
import type { SessionStore } from "./session.store.js";
import type { AccountSession, NewSession } from "./session.types.js";

// Le service est créé en production : noms préfixés.
const PENDING_LOGIN_COOKIE = "__Host-Http-etape-front-office.txn";
const SESSION_COOKIE = "__Host-Http-etape-front-office.sid";
const BACK_OFFICE_SESSION_COOKIE = "__Host-Http-etape-back-office.sid";

const key = randomBytes(32);

class FakeSessionStore implements SessionStore {
  readonly sessions = new Map<string, NewSession>();

  async createSession(id: string, session: NewSession): Promise<void> {
    this.sessions.set(id, session);
  }

  async getSession(id: string): Promise<AccountSession | null> {
    const session = this.sessions.get(id);
    return session ? { ...session, sub: "sub" } : null;
  }

  async extendSession(id: string, idleExpiresAt: number): Promise<void> {
    const session = this.sessions.get(id);
    if (session) this.sessions.set(id, { ...session, idleExpiresAt });
  }

  async deleteSession(id: string): Promise<void> {
    this.sessions.delete(id);
  }
}

class FakeResponse {
  readonly cookies = new Map<string, { value: string; options: CookieOptions }>();
  readonly clearedCookies: string[] = [];
  readonly clearedCookieOptions = new Map<string, CookieOptions>();

  cookie(name: string, value: string, options: CookieOptions): this {
    this.cookies.set(name, { value, options });
    return this;
  }

  clearCookie(name: string, options: CookieOptions): this {
    this.clearedCookies.push(name);
    this.clearedCookieOptions.set(name, options);
    return this;
  }
}

function createRequest(cookies: Record<string, string>): Request {
  return { cookies } as unknown as Request;
}

function createService(
  store: SessionStore,
  nodeEnv: Env["NODE_ENV"] = NODE_ENV.PRODUCTION,
): SessionService {
  const values: Partial<Env> = {
    COOKIE_ENCRYPTION_KEY: key.toString("base64"),
    NODE_ENV: nodeEnv,
  };
  const config = { get: (name: keyof Env) => values[name] } as unknown as ConfigService<Env, true>;

  return new SessionService(store, config);
}

const pendingLogin = {
  state: "state",
  nonce: "nonce",
  codeVerifier: "verifier",
  returnTo: "/compte/",
};

describe("SessionService", () => {
  let store: FakeSessionStore;
  let service: SessionService;

  beforeEach(() => {
    store = new FakeSessionStore();
    service = createService(store);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("transaction de connexion", () => {
    it("pose un cookie httpOnly, sécurisé et lax, puis relit la transaction", () => {
      const response = new FakeResponse();
      service.startPendingLogin(response as unknown as Response, FRONT.FRONT_OFFICE, pendingLogin);

      const cookie = response.cookies.get(PENDING_LOGIN_COOKIE);
      expect(cookie?.options).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax" });

      const consumed = service.consumePendingLogin(
        createRequest({ [PENDING_LOGIN_COOKIE]: cookie!.value }),
        new FakeResponse() as unknown as Response,
        FRONT.FRONT_OFFICE,
      );
      expect(consumed).toMatchObject(pendingLogin);
    });

    it("efface le cookie à la lecture", () => {
      const response = new FakeResponse();
      service.consumePendingLogin(
        createRequest({}),
        response as unknown as Response,
        FRONT.FRONT_OFFICE,
      );

      expect(response.clearedCookies).toContain(PENDING_LOGIN_COOKIE);
    });

    it("refuse une transaction expirée", () => {
      vi.useFakeTimers();
      const response = new FakeResponse();
      service.startPendingLogin(response as unknown as Response, FRONT.FRONT_OFFICE, pendingLogin);

      vi.advanceTimersByTime(10 * 60 * 1000 + 1);

      const consumed = service.consumePendingLogin(
        createRequest({
          [PENDING_LOGIN_COOKIE]: response.cookies.get(PENDING_LOGIN_COOKIE)!.value,
        }),
        new FakeResponse() as unknown as Response,
        FRONT.FRONT_OFFICE,
      );
      expect(consumed).toBeNull();
    });

    it("refuse un cookie scellé avec une autre clé", () => {
      const sealed = sealCookieValue(
        randomBytes(32),
        JSON.stringify({ ...pendingLogin, expiresAt: Date.now() + 60_000 }),
      );

      expect(
        service.consumePendingLogin(
          createRequest({ [PENDING_LOGIN_COOKIE]: sealed }),
          new FakeResponse() as unknown as Response,
          FRONT.FRONT_OFFICE,
        ),
      ).toBeNull();
    });

    it("refuse un contenu déchiffrable mais hors schéma", () => {
      const tooLong = sealCookieValue(
        key,
        JSON.stringify({
          ...pendingLogin,
          returnTo: `/${"a".repeat(MAX_RETURN_TO_LENGTH)}`,
          expiresAt: Date.now() + 60_000,
        }),
      );
      const notJson = sealCookieValue(key, "pas du JSON");

      for (const sealed of [tooLong, notJson]) {
        expect(
          service.consumePendingLogin(
            createRequest({ [PENDING_LOGIN_COOKIE]: sealed }),
            new FakeResponse() as unknown as Response,
            FRONT.FRONT_OFFICE,
          ),
        ).toBeNull();
      }
    });
  });

  describe("session", () => {
    const newSession = {
      accountId: "account",
      front: FRONT.FRONT_OFFICE,
      identityProvider: "local",
      claims: {},
      idToken: "id-token",
    };

    it("révoque la session précédente du navigateur à la reconnexion", async () => {
      const firstResponse = new FakeResponse();
      await service.openSession(
        createRequest({}),
        firstResponse as unknown as Response,
        newSession,
      );
      const firstId = firstResponse.cookies.get(SESSION_COOKIE)!.value;

      const secondResponse = new FakeResponse();
      await service.openSession(
        createRequest({ [SESSION_COOKIE]: firstId }),
        secondResponse as unknown as Response,
        newSession,
      );
      const secondId = secondResponse.cookies.get(SESSION_COOKIE)!.value;

      expect(secondId).not.toBe(firstId);
      expect(store.sessions.has(firstId)).toBe(false);
      expect(store.sessions.has(secondId)).toBe(true);
    });

    it("efface le cookie de session avant de toucher au stockage", async () => {
      const response = new FakeResponse();
      vi.spyOn(store, "getSession").mockRejectedValue(new Error("base injoignable"));

      await expect(
        service.closeSession(
          createRequest({ [SESSION_COOKIE]: "5f0c8a52-6f0e-4f7a-9a39-1f1b8a6f2c11" }),
          response as unknown as Response,
          FRONT.FRONT_OFFICE,
        ),
      ).rejects.toThrow("base injoignable");
      expect(response.clearedCookies).toContain(SESSION_COOKIE);
    });

    it("renvoie la session fermée, pour la déconnexion chez Keycloak", async () => {
      const openResponse = new FakeResponse();
      await service.openSession(createRequest({}), openResponse as unknown as Response, newSession);
      const id = openResponse.cookies.get(SESSION_COOKIE)!.value;

      const closed = await service.closeSession(
        createRequest({ [SESSION_COOKIE]: id }),
        new FakeResponse() as unknown as Response,
        FRONT.FRONT_OFFICE,
      );

      expect(closed?.idToken).toBe(newSession.idToken);
      expect(store.sessions.has(id)).toBe(false);
    });

    it("ignore un identifiant de session qui n'est pas un UUID", async () => {
      const getSession = vi.spyOn(store, "getSession");

      expect(
        await service.readSession(
          createRequest({ [SESSION_COOKIE]: "../../admin" }),
          FRONT.FRONT_OFFICE,
        ),
      ).toBeNull();
      expect(getSession).not.toHaveBeenCalled();
    });

    it("ne rend pas une session au front qui ne l'a pas ouverte", async () => {
      const openResponse = new FakeResponse();
      await service.openSession(createRequest({}), openResponse as unknown as Response, newSession);
      const id = openResponse.cookies.get(SESSION_COOKIE)!.value;

      // L'identifiant recopié sous le nom du cookie du back-office.
      const copied = createRequest({ [BACK_OFFICE_SESSION_COOKIE]: id });

      expect(await service.readSession(copied, FRONT.BACK_OFFICE)).toBeNull();
      expect(
        await service.readSession(createRequest({ [SESSION_COOKIE]: id }), FRONT.FRONT_OFFICE),
      ).not.toBeNull();
    });

    it("ne ferme pas la session d'un autre front", async () => {
      const openResponse = new FakeResponse();
      await service.openSession(createRequest({}), openResponse as unknown as Response, newSession);
      const id = openResponse.cookies.get(SESSION_COOKIE)!.value;

      const closed = await service.closeSession(
        createRequest({ [BACK_OFFICE_SESSION_COOKIE]: id }),
        new FakeResponse() as unknown as Response,
        FRONT.BACK_OFFICE,
      );

      expect(closed).toBeNull();
      expect(store.sessions.has(id)).toBe(true);
    });

    it("nomme le cookie selon le front, que localhost partage entre les ports", async () => {
      const response = new FakeResponse();
      await service.openSession(createRequest({}), response as unknown as Response, {
        ...newSession,
        front: FRONT.BACK_OFFICE,
      });

      expect(response.cookies.has(BACK_OFFICE_SESSION_COOKIE)).toBe(true);
      expect(response.cookies.has(SESSION_COOKIE)).toBe(false);
    });

    it("fixe les deux fins de session selon la règle du front", async () => {
      vi.useFakeTimers({ now: 0 });

      for (const front of Object.values(FRONT)) {
        const response = new FakeResponse();
        await service.openSession(createRequest({}), response as unknown as Response, {
          ...newSession,
          front,
        });

        const [cookie] = response.cookies.values();
        const policy = SESSION_POLICY_BY_FRONT[front];
        expect(store.sessions.get(cookie!.value)).toMatchObject({
          expiresAt: policy.maxDurationMs,
          idleExpiresAt: policy.idleTimeoutMs,
        });
        // Le cookie vit jusqu'à la fin absolue, pas au-delà.
        expect(cookie?.options.maxAge).toBe(policy.maxDurationMs);
      }
    });

    it("repousse la fin d'inactivité, en écrivant au plus une fois par minute", async () => {
      vi.useFakeTimers({ now: 0 });
      const { idleTimeoutMs } = SESSION_POLICY_BY_FRONT[FRONT.FRONT_OFFICE];
      const openResponse = new FakeResponse();
      await service.openSession(createRequest({}), openResponse as unknown as Response, newSession);
      const request = createRequest({
        [SESSION_COOKIE]: openResponse.cookies.get(SESSION_COOKIE)!.value,
      });
      const extendSession = vi.spyOn(store, "extendSession");

      vi.advanceTimersByTime(30 * 1000);
      const early = await service.recordActivity(
        (await service.readSession(request, FRONT.FRONT_OFFICE))!,
      );
      expect(extendSession).not.toHaveBeenCalled();
      expect(early.idleExpiresAt).toBe(idleTimeoutMs);

      vi.advanceTimersByTime(30 * 1000);
      const due = await service.recordActivity(
        (await service.readSession(request, FRONT.FRONT_OFFICE))!,
      );
      expect(due.idleExpiresAt).toBe(60 * 1000 + idleTimeoutMs);
      expect((await service.readSession(request, FRONT.FRONT_OFFICE))?.idleExpiresAt).toBe(
        due.idleExpiresAt,
      );
    });

    it("ne repousse jamais la fin absolue", async () => {
      vi.useFakeTimers({ now: 0 });
      const { maxDurationMs } = SESSION_POLICY_BY_FRONT[FRONT.FRONT_OFFICE];
      const openResponse = new FakeResponse();
      await service.openSession(createRequest({}), openResponse as unknown as Response, newSession);
      const request = createRequest({
        [SESSION_COOKIE]: openResponse.cookies.get(SESSION_COOKIE)!.value,
      });

      vi.advanceTimersByTime(5 * 60 * 1000);
      const session = await service.recordActivity(
        (await service.readSession(request, FRONT.FRONT_OFFICE))!,
      );

      expect(session.expiresAt).toBe(maxDurationMs);
    });
  });

  describe("attributs des cookies", () => {
    const newSession = {
      accountId: "account",
      front: FRONT.FRONT_OFFICE,
      identityProvider: "local",
      claims: {},
      idToken: "id-token",
    };

    it("pose en production un cookie __Host-Http-, sécurisé, sur / et sans Domain", async () => {
      const response = new FakeResponse();
      await service.openSession(createRequest({}), response as unknown as Response, newSession);

      const cookie = response.cookies.get(SESSION_COOKIE);
      expect(cookie?.options).toMatchObject({ httpOnly: true, secure: true, path: "/" });
      expect(cookie?.options.domain).toBeUndefined();
    });

    it("efface avec les mêmes attributs, sans quoi le navigateur ignore l'effacement", async () => {
      const response = new FakeResponse();
      await service.closeSession(
        createRequest({}),
        response as unknown as Response,
        FRONT.FRONT_OFFICE,
      );

      expect(response.clearedCookieOptions.get(SESSION_COOKIE)).toMatchObject({
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      });
    });

    it("relit le cookie préfixé", async () => {
      const openResponse = new FakeResponse();
      await service.openSession(createRequest({}), openResponse as unknown as Response, newSession);
      const id = openResponse.cookies.get(SESSION_COOKIE)!.value;

      expect(
        await service.readSession(createRequest({ [SESSION_COOKIE]: id }), FRONT.FRONT_OFFICE),
      ).not.toBeNull();
      // Le même identifiant sous le nom sans préfixe, posable par un script ou un
      // sous-domaine, n'est pas lu.
      expect(
        await service.readSession(
          createRequest({ "etape-front-office.sid": id }),
          FRONT.FRONT_OFFICE,
        ),
      ).toBeNull();
    });

    it("garde en local des noms sans préfixe, sans Secure", async () => {
      const localService = createService(store, NODE_ENV.DEVELOPMENT);
      const response = new FakeResponse();
      await localService.openSession(
        createRequest({}),
        response as unknown as Response,
        newSession,
      );

      expect(response.cookies.get("etape-front-office.sid")?.options).toMatchObject({
        secure: false,
      });
    });
  });
});
