import type { AccountSession, NewSession } from "./session.types.js";

/**
 * Le navigateur ne reçoit qu'un identifiant opaque : la session reste révocable,
 * et l'`id_token` ne transite pas dans un cookie, où il dépasserait les 4 Ko.
 */
export abstract class SessionRepository {
  abstract createSession(id: string, session: NewSession): Promise<void>;
  /** Telle qu'en base, même expirée : c'est le service qui juge de sa fin. */
  abstract getSession(id: string): Promise<AccountSession | null>;
  abstract extendSession(id: string, idleExpiresAt: number): Promise<void>;
  abstract deleteSession(id: string): Promise<void>;
  /** Les sessions dont l'une des deux fins est passée à `now`. */
  abstract deleteExpiredSessions(now: number): Promise<void>;
}
