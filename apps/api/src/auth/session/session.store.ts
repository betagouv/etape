import { Injectable } from "@nestjs/common";

import type { LoginTransaction, UserSession } from "./session.types.js";

/**
 * Le navigateur ne reçoit qu'un identifiant opaque : la session reste révocable,
 * et l'`id_token` ne transite pas dans un cookie, où il dépasserait les 4 Ko.
 */
export abstract class SessionStore {
  abstract createTransaction(id: string, transaction: LoginTransaction): Promise<void>;
  /** Lecture unique : une transaction consommée ne se rejoue pas. */
  abstract consumeTransaction(id: string): Promise<LoginTransaction | null>;

  abstract createSession(id: string, session: UserSession): Promise<void>;
  abstract getSession(id: string): Promise<UserSession | null>;
  abstract deleteSession(id: string): Promise<void>;
}

/**
 * **Développement local uniquement** : tout disparaît au redémarrage, et rien
 * n'est partagé entre instances. L'implémentation cible se substitue à celle-ci
 * dans `AuthModule`.
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
