import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { CookieOptions, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { NODE_ENV, type Env } from "../../config/env.js";
import { MAX_RETURN_TO_LENGTH } from "../return-to.js";
import { openCookieValue, sealCookieValue } from "./cookie-cipher.js";
import { SessionStore } from "./session.store.js";
import type { AccountSession, NewSession, PendingLogin } from "./session.types.js";

const SESSION_COOKIE = "etape.sid";
const TRANSACTION_COOKIE = "etape.txn";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TRANSACTION_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const pendingLoginSchema = z.object({
  state: z.string().min(1),
  nonce: z.string().min(1),
  codeVerifier: z.string().min(1),
  returnTo: z.string().max(MAX_RETURN_TO_LENGTH),
  expiresAt: z.number().int(),
}) satisfies z.ZodType<PendingLogin>;

/**
 * Fait le lien entre les cookies du navigateur et le stockage serveur. La
 * politique de cookies est concentrée ici : un attribut oublié à un seul endroit
 * ouvrirait une faille invisible à la relecture.
 */
@Injectable()
export class SessionService {
  private readonly cookieKey: Buffer;

  constructor(
    private readonly store: SessionStore,
    private readonly config: ConfigService<Env, true>,
  ) {
    const encodedKey: string = config.get("COOKIE_ENCRYPTION_KEY", { infer: true });
    this.cookieKey = Buffer.from(encodedKey, "base64");
  }

  /**
   * `strict` casserait la connexion : au retour sur `/auth/callback`, le
   * navigateur voit une navigation venue d'un autre site et n'enverrait pas le
   * cookie. `lax` l'autorise pour un GET de premier niveau — la forme exacte du
   * callback — sans rouvrir le CSRF.
   */
  private cookieOptions(maxAgeMs: number): CookieOptions {
    return {
      httpOnly: true,
      sameSite: "lax",
      secure: this.config.get("NODE_ENV", { infer: true }) === NODE_ENV.PRODUCTION,
      path: "/",
      maxAge: maxAgeMs,
    };
  }

  /**
   * Chiffrée dans le cookie plutôt qu'écrite en base : la route de départ est
   * anonyme, et rien de ce qu'elle reçoit ne doit pouvoir remplir le stockage.
   */
  startTransaction(response: Response, transaction: Omit<PendingLogin, "expiresAt">): void {
    const pendingLogin: PendingLogin = {
      ...transaction,
      expiresAt: Date.now() + TRANSACTION_TTL_MS,
    };

    response.cookie(
      TRANSACTION_COOKIE,
      sealCookieValue(this.cookieKey, JSON.stringify(pendingLogin)),
      this.cookieOptions(TRANSACTION_TTL_MS),
    );
  }

  /** Le cookie est effacé dès la lecture ; Keycloak refuse de rejouer un code. */
  consumeTransaction(request: Request, response: Response): PendingLogin | null {
    const sealedValue = this.readRawCookie(request, TRANSACTION_COOKIE);
    response.clearCookie(TRANSACTION_COOKIE, { path: "/" });

    if (!sealedValue) return null;

    const json = openCookieValue(this.cookieKey, sealedValue);
    if (!json) return null;

    const result = pendingLoginSchema.safeParse(parseJson(json));
    if (!result.success || result.data.expiresAt <= Date.now()) return null;

    return result.data;
  }

  /** Remplace la session du navigateur : se reconnecter révoque la précédente. */
  async openSession(
    request: Request,
    response: Response,
    session: Omit<NewSession, "expiresAt">,
  ): Promise<void> {
    const previousId = this.readSessionId(request);
    if (previousId) await this.store.deleteSession(previousId);

    const id = randomUUID();

    await this.store.createSession(id, { ...session, expiresAt: Date.now() + SESSION_TTL_MS });
    response.cookie(SESSION_COOKIE, id, this.cookieOptions(SESSION_TTL_MS));
  }

  async readSession(request: Request): Promise<AccountSession | null> {
    const id = this.readSessionId(request);
    return id ? this.store.getSession(id) : null;
  }

  async closeSession(request: Request, response: Response): Promise<void> {
    const id = this.readSessionId(request);
    if (id) await this.store.deleteSession(id);

    response.clearCookie(SESSION_COOKIE, { path: "/" });
  }

  private readSessionId(request: Request): string | null {
    const value = this.readRawCookie(request, SESSION_COOKIE);
    return value && UUID.test(value) ? value : null;
  }

  private readRawCookie(request: Request, name: string): string | null {
    const value: unknown = (request.cookies as Record<string, unknown> | undefined)?.[name];
    return typeof value === "string" && value.length > 0 ? value : null;
  }
}

function parseJson(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}
