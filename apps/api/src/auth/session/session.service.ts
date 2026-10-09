import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { CookieOptions, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { NODE_ENV, type Env } from "../../config/env.js";
import { FRONT, type Front } from "../front.js";
import { MAX_RETURN_TO_LENGTH } from "../return-to.js";
import { openCookieValue, sealCookieValue } from "./cookie-cipher.js";
import { isActivityWriteDue, SESSION_POLICY_BY_FRONT } from "./session-policy.js";
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

/**
 * Préfixe des cookies en production. Le navigateur n'accepte un cookie ainsi
 * nommé que s'il est `Secure`, sur `Path=/`, sans `Domain` — donc lié à l'hôte
 * exact de son front, sans qu'un sous-domaine puisse le poser ou l'écraser — et,
 * pour `Http`, `HttpOnly` : aucun script ne peut le créer. Un navigateur qui ne
 * connaît que `__Host-` en applique déjà les trois premières règles. Pas en
 * local : `http://` n'y a pas `Secure`.
 */
const PRODUCTION_COOKIE_PREFIX = "__Host-Http-";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PENDING_LOGIN_TTL_MS = 10 * 60 * 1000;

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

  private get isProduction(): boolean {
    return this.config.get("NODE_ENV", { infer: true }) === NODE_ENV.PRODUCTION;
  }

  private cookieName(name: string): string {
    return this.isProduction ? `${PRODUCTION_COOKIE_PREFIX}${name}` : name;
  }

  /**
   * Communs à la pose et à l'effacement : un cookie `__Host-` ne s'efface
   * qu'avec les mêmes attributs, `Secure` compris, sans quoi le navigateur
   * ignore l'effacement et la déconnexion laisse le cookie en place.
   *
   * `strict` casserait la connexion : au retour sur `/auth/callback`, le
   * navigateur voit une navigation venue d'un autre site et n'enverrait pas le
   * cookie. `lax` l'autorise pour un GET de premier niveau — la forme exacte du
   * callback — sans rouvrir le CSRF.
   */
  private get baseCookieOptions(): CookieOptions {
    return { httpOnly: true, sameSite: "lax", secure: this.isProduction, path: "/" };
  }

  private setCookie(response: Response, name: string, value: string, maxAgeMs: number): void {
    response.cookie(this.cookieName(name), value, { ...this.baseCookieOptions, maxAge: maxAgeMs });
  }

  private clearCookie(response: Response, name: string): void {
    response.clearCookie(this.cookieName(name), this.baseCookieOptions);
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

    this.setCookie(
      response,
      PENDING_LOGIN_COOKIE[front],
      sealCookieValue(this.cookieKey, JSON.stringify(pendingLogin)),
      PENDING_LOGIN_TTL_MS,
    );
  }

  consumePendingLogin(request: Request, response: Response, front: Front): PendingLogin | null {
    const sealedValue = this.readRawCookie(request, this.cookieName(PENDING_LOGIN_COOKIE[front]));
    this.clearCookie(response, PENDING_LOGIN_COOKIE[front]);

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
    session: Omit<NewSession, "expiresAt" | "idleExpiresAt">,
  ): Promise<void> {
    const previous = await this.readSession(request, session.front);
    if (previous) await this.store.deleteSession(previous.id);

    const id = randomUUID();
    const policy = SESSION_POLICY_BY_FRONT[session.front];
    const now = Date.now();

    await this.store.createSession(id, {
      ...session,
      expiresAt: now + policy.maxDurationMs,
      idleExpiresAt: now + policy.idleTimeoutMs,
    });
    // Le cookie vit jusqu'à la fin absolue ; l'inactivité, elle, ne se juge
    // que côté serveur.
    this.setCookie(response, SESSION_COOKIE[session.front], id, policy.maxDurationMs);
  }

  /**
   * Repousse la fin d'inactivité. Appelé pour chaque requête authentifiée
   * (`SessionGuard`) ; n'écrit qu'une fois par minute au plus.
   */
  async recordActivity<T extends AccountSession & { id: string }>(session: T): Promise<T> {
    const policy = SESSION_POLICY_BY_FRONT[session.front];
    const now = Date.now();

    if (!isActivityWriteDue(session.idleExpiresAt, policy, now)) return session;

    const idleExpiresAt = now + policy.idleTimeoutMs;
    await this.store.extendSession(session.id, idleExpiresAt);

    return { ...session, idleExpiresAt };
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
    this.clearCookie(response, SESSION_COOKIE[front]);

    const session = await this.readSession(request, front);
    if (!session) return null;

    await this.store.deleteSession(session.id);
    return session;
  }

  private readSessionId(request: Request, front: Front): string | null {
    const value = this.readRawCookie(request, this.cookieName(SESSION_COOKIE[front]));
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
