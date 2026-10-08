import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { CookieOptions, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { NODE_ENV, type Env } from "../../config/env.js";
import { FRONT, type Front } from "../front.js";
import { MAX_RETURN_TO_LENGTH } from "../return-to.js";
import { openCookieValue, sealCookieValue } from "./cookie-cipher.js";
import { SessionStore } from "./session.store.js";
import type { AccountSession, NewSession, PendingLogin } from "./session.types.js";

/**
 * Un nom par front. En production, les deux fronts ont chacun leur hôte et ne
 * voient jamais les cookies l'un de l'autre ; en local, `localhost:5173` et
 * `localhost:5174` partagent les leurs — un cookie ne distingue pas les ports —
 * et une connexion au back-office écraserait celle du front-office.
 */
const SESSION_COOKIE: Record<Front, string> = {
  [FRONT.FRONT_OFFICE]: "etape-front-office.sid",
  [FRONT.BACK_OFFICE]: "etape-back-office.sid",
};
const PENDING_LOGIN_COOKIE: Record<Front, string> = {
  [FRONT.FRONT_OFFICE]: "etape-front-office.txn",
  [FRONT.BACK_OFFICE]: "etape-back-office.txn",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PENDING_LOGIN_TTL_MS = 10 * 60 * 1000;
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

  startPendingLogin(
    response: Response,
    front: Front,
    login: Omit<PendingLogin, "expiresAt">,
  ): void {
    const pendingLogin: PendingLogin = {
      ...login,
      expiresAt: Date.now() + PENDING_LOGIN_TTL_MS,
    };

    response.cookie(
      PENDING_LOGIN_COOKIE[front],
      sealCookieValue(this.cookieKey, JSON.stringify(pendingLogin)),
      this.cookieOptions(PENDING_LOGIN_TTL_MS),
    );
  }

  consumePendingLogin(request: Request, response: Response, front: Front): PendingLogin | null {
    const sealedValue = this.readRawCookie(request, PENDING_LOGIN_COOKIE[front]);
    response.clearCookie(PENDING_LOGIN_COOKIE[front], { path: "/" });

    if (!sealedValue) return null;

    const json = openCookieValue(this.cookieKey, sealedValue);
    if (!json) return null;

    const result = pendingLoginSchema.safeParse(parseJson(json));
    if (!result.success || result.data.expiresAt <= Date.now()) return null;

    return result.data;
  }

  async openSession(
    request: Request,
    response: Response,
    session: Omit<NewSession, "expiresAt">,
  ): Promise<void> {
    const previous = await this.readSession(request, session.front);
    if (previous) await this.store.deleteSession(previous.id);

    const id = randomUUID();

    await this.store.createSession(id, { ...session, expiresAt: Date.now() + SESSION_TTL_MS });
    response.cookie(SESSION_COOKIE[session.front], id, this.cookieOptions(SESSION_TTL_MS));
  }

  /**
   * La session n'est rendue que sur le front où elle a été ouverte. Le
   * navigateur n'envoie de lui-même le cookie qu'au front qui l'a reçu, mais une
   * personne peut copier son identifiant de session depuis son navigateur et
   * l'envoyer elle-même à l'autre front. Pour celui-ci, personne n'est connecté.
   */
  async readSession(
    request: Request,
    front: Front,
  ): Promise<(AccountSession & { id: string }) | null> {
    const id = this.readSessionId(request, front);
    if (!id) return null;

    const session = await this.store.getSession(id);
    return session?.front === front ? { ...session, id } : null;
  }

  /**
   * Une session d'un autre front n'est pas supprimée : la déconnexion ne vaut
   * que pour le front qui la demande.
   */
  async closeSession(
    request: Request,
    response: Response,
    front: Front,
  ): Promise<AccountSession | null> {
    response.clearCookie(SESSION_COOKIE[front], { path: "/" });

    const session = await this.readSession(request, front);
    if (!session) return null;

    await this.store.deleteSession(session.id);
    return session;
  }

  private readSessionId(request: Request, front: Front): string | null {
    const value = this.readRawCookie(request, SESSION_COOKIE[front]);
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
