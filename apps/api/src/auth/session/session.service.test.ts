import type { ConfigService } from "@nestjs/config";
import type { CookieOptions, Request, Response } from "express";
import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NODE_ENV, type Env } from "../../config/env.js";
import { MAX_RETURN_TO_LENGTH } from "../return-to.js";
import { sealCookieValue } from "./cookie-cipher.js";
import { SessionService } from "./session.service.js";
import type { SessionStore } from "./session.store.js";
import type { AccountSession, NewSession } from "./session.types.js";

const TRANSACTION_COOKIE = "etape.txn";
const SESSION_COOKIE = "etape.sid";

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

  async deleteSession(id: string): Promise<void> {
    this.sessions.delete(id);
  }
}

class FakeResponse {
  readonly cookies = new Map<string, { value: string; options: CookieOptions }>();
  readonly clearedCookies: string[] = [];

  cookie(name: string, value: string, options: CookieOptions): this {
    this.cookies.set(name, { value, options });
    return this;
  }

  clearCookie(name: string): this {
    this.clearedCookies.push(name);
    return this;
  }
}

function createRequest(cookies: Record<string, string>): Request {
  return { cookies } as unknown as Request;
}

function createService(store: SessionStore): SessionService {
  const values: Partial<Env> = {
    COOKIE_ENCRYPTION_KEY: key.toString("base64"),
    NODE_ENV: NODE_ENV.PRODUCTION,
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
      service.startTransaction(response as unknown as Response, pendingLogin);

      const cookie = response.cookies.get(TRANSACTION_COOKIE);
      expect(cookie?.options).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax" });

      const transaction = service.consumeTransaction(
        createRequest({ [TRANSACTION_COOKIE]: cookie!.value }),
        new FakeResponse() as unknown as Response,
      );
      expect(transaction).toMatchObject(pendingLogin);
    });

    it("efface le cookie à la lecture", () => {
      const response = new FakeResponse();
      service.consumeTransaction(createRequest({}), response as unknown as Response);

      expect(response.clearedCookies).toContain(TRANSACTION_COOKIE);
    });

    it("refuse une transaction expirée", () => {
      vi.useFakeTimers();
      const response = new FakeResponse();
      service.startTransaction(response as unknown as Response, pendingLogin);

      vi.advanceTimersByTime(10 * 60 * 1000 + 1);

      const transaction = service.consumeTransaction(
        createRequest({ [TRANSACTION_COOKIE]: response.cookies.get(TRANSACTION_COOKIE)!.value }),
        new FakeResponse() as unknown as Response,
      );
      expect(transaction).toBeNull();
    });

    it("refuse un cookie scellé avec une autre clé", () => {
      const sealed = sealCookieValue(
        randomBytes(32),
        JSON.stringify({ ...pendingLogin, expiresAt: Date.now() + 60_000 }),
      );

      expect(
        service.consumeTransaction(
          createRequest({ [TRANSACTION_COOKIE]: sealed }),
          new FakeResponse() as unknown as Response,
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
          service.consumeTransaction(
            createRequest({ [TRANSACTION_COOKIE]: sealed }),
            new FakeResponse() as unknown as Response,
          ),
        ).toBeNull();
      }
    });
  });

  describe("session", () => {
    const newSession = {
      accountId: "account",
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

    it("ignore un identifiant de session qui n'est pas un UUID", async () => {
      const getSession = vi.spyOn(store, "getSession");

      expect(
        await service.readSession(createRequest({ [SESSION_COOKIE]: "../../admin" })),
      ).toBeNull();
      expect(getSession).not.toHaveBeenCalled();
    });
  });
});
