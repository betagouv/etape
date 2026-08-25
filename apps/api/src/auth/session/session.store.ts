import { Injectable } from "@nestjs/common";

import type { LoginTransaction, UserSession } from "./session.types.js";

/**
 * Stockage serveur des sessions et des transactions de connexion.
 *
 * Le navigateur ne reçoit qu'un identifiant opaque ; tout le contenu vit ici.
 * C'est ce qui permet de révoquer une session côté serveur et évite de faire
 * transiter l'`id_token` dans un cookie — il dépasserait vite les 4 Ko autorisés.
 */
export abstract class SessionStore {
  abstract createTransaction(id: string, transaction: LoginTransaction): Promise<void>;
  /** Lecture unique : une transaction consommée ne doit pas pouvoir être rejouée. */
  abstract consumeTransaction(id: string): Promise<LoginTransaction | null>;

  abstract createSession(id: string, session: UserSession): Promise<void>;
  abstract getSession(id: string): Promise<UserSession | null>;
  abstract deleteSession(id: string): Promise<void>;
}

/**
 * Implémentation en mémoire, **pour le développement local uniquement**.
 *
 * Deux limites rédhibitoires en production : tout disparaît au redémarrage, et
 * rien n'est partagé entre instances — dès qu'il y en a deux, une requête sur
 * deux se retrouve déconnectée.
 *
 * L'implémentation cible (Redis ou Postgres) dépend de ce que fournira
 * l'hébergement ; elle se substitue à celle-ci par le provider de
 * `AuthModule`, sans toucher au reste du code.
 */
@Injectable()
export class InMemorySessionStore extends SessionStore {
  private readonly transactions = new Map<string, LoginTransaction>();
  private readonly sessions = new Map<string, UserSession>();

  async createTransaction(id: string, transaction: LoginTransaction): Promise<void> {
    this.purge();
    this.transactions.set(id, transaction);
  }

  async consumeTransaction(id: string): Promise<LoginTransaction | null> {
    const transaction = this.transactions.get(id);
    if (!transaction) return null;

    this.transactions.delete(id);
    return transaction.expiresAt > Date.now() ? transaction : null;
  }

  async createSession(id: string, session: UserSession): Promise<void> {
    this.purge();
    this.sessions.set(id, session);
  }

  async getSession(id: string): Promise<UserSession | null> {
    const session = this.sessions.get(id);
    if (!session) return null;

    if (session.expiresAt <= Date.now()) {
      this.sessions.delete(id);
      return null;
    }

    return session;
  }

  async deleteSession(id: string): Promise<void> {
    this.sessions.delete(id);
  }

  /** Évite que la mémoire enfle indéfiniment sur un serveur de dev laissé ouvert. */
  private purge(): void {
    const now = Date.now();

    for (const [id, transaction] of this.transactions) {
      if (transaction.expiresAt <= now) this.transactions.delete(id);
    }
    for (const [id, session] of this.sessions) {
      if (session.expiresAt <= now) this.sessions.delete(id);
    }
  }
}
