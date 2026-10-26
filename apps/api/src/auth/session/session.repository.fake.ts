import type { SessionRepository } from "./session.repository.js";
import type { AccountSession, NewSession } from "./session.types.js";

/**
 * Double de test : les sessions en mémoire, rendues telles quelles, même
 * expirées, comme la base. Exclu du build (`tsconfig.build.json`).
 */
export class FakeSessionRepository implements SessionRepository {
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

  async deleteExpiredSessions(now: number): Promise<void> {
    for (const [id, session] of this.sessions) {
      if (session.expiresAt <= now || session.idleExpiresAt <= now) this.sessions.delete(id);
    }
  }
}
