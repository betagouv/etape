import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { CookieOptions, Request, Response } from "express";
import { randomUUID } from "node:crypto";

import type { Env } from "../../config/env.js";
import { SessionStore } from "./session.store.js";
import type { LoginTransaction, UserSession } from "./session.types.js";

/** Identifiant de session. Opaque : aucune donnée utilisateur n'y transite. */
const SESSION_COOKIE = "etape.sid";
/** Identifiant de la transaction de connexion en cours. */
const TRANSACTION_COOKIE = "etape.txn";

const TRANSACTION_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

/**
 * Fait le lien entre les cookies du navigateur et le stockage serveur.
 *
 * Toute la politique de cookies est concentrée ici plutôt que dispersée dans le
 * contrôleur : un attribut oublié à un seul endroit suffirait à ouvrir une
 * faille, et c'est invisible à la relecture quand les appels sont éparpillés.
 */
@Injectable()
export class SessionService {
  constructor(
    private readonly store: SessionStore,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /**
   * Attributs communs à tous les cookies posés par l'API.
   *
   * `sameSite: "lax"` est le point délicat. `strict` casserait la connexion : au
   * retour de Keycloak sur `/auth/callback`, le navigateur considère la
   * navigation comme venant d'un autre site et n'enverrait pas le cookie de
   * transaction. `lax` l'autorise pour une navigation de premier niveau en GET,
   * ce qui est exactement la forme du callback, sans rouvrir le CSRF sur les
   * requêtes de fond.
   */
  private cookieOptions(maxAgeMs: number): CookieOptions {
    return {
      httpOnly: true,
      // Le front et l'API partagent l'origine derrière nginx : pas de `domain`
      // à poser, et rien à assouplir côté CORS.
      sameSite: "lax",
      secure: this.config.get("NODE_ENV", { infer: true }) === "production",
      path: "/",
      maxAge: maxAgeMs,
    };
  }

  async startTransaction(
    response: Response,
    transaction: Omit<LoginTransaction, "expiresAt">,
  ): Promise<void> {
    const id = randomUUID();

    await this.store.createTransaction(id, {
      ...transaction,
      expiresAt: Date.now() + TRANSACTION_TTL_MS,
    });

    response.cookie(TRANSACTION_COOKIE, id, this.cookieOptions(TRANSACTION_TTL_MS));
  }

  /** Consomme la transaction et retire son cookie : elle ne sert qu'une fois. */
  async consumeTransaction(request: Request, response: Response): Promise<LoginTransaction | null> {
    const id = this.readCookie(request, TRANSACTION_COOKIE);
    response.clearCookie(TRANSACTION_COOKIE, { path: "/" });

    return id ? this.store.consumeTransaction(id) : null;
  }

  async openSession(response: Response, session: Omit<UserSession, "expiresAt">): Promise<void> {
    const id = randomUUID();

    await this.store.createSession(id, { ...session, expiresAt: Date.now() + SESSION_TTL_MS });
    response.cookie(SESSION_COOKIE, id, this.cookieOptions(SESSION_TTL_MS));
  }

  async readSession(request: Request): Promise<UserSession | null> {
    const id = this.readCookie(request, SESSION_COOKIE);
    return id ? this.store.getSession(id) : null;
  }

  async closeSession(request: Request, response: Response): Promise<void> {
    const id = this.readCookie(request, SESSION_COOKIE);
    if (id) await this.store.deleteSession(id);

    response.clearCookie(SESSION_COOKIE, { path: "/" });
  }

  private readCookie(request: Request, name: string): string | null {
    const value: unknown = (request.cookies as Record<string, unknown> | undefined)?.[name];
    return typeof value === "string" && value.length > 0 ? value : null;
  }
}
