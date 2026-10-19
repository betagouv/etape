import type { AccountSession, NewSession } from "./session.types.js";

/**
 * Le navigateur ne reçoit qu'un identifiant opaque : la session reste révocable,
 * et l'`id_token` ne transite pas dans un cookie, où il dépasserait les 4 Ko.
 */
export abstract class SessionRepository {
  abstract createSession(id: string, session: NewSession): Promise<void>;
  abstract getSession(id: string): Promise<AccountSession | null>;
  abstract extendSession(id: string, idleExpiresAt: number): Promise<void>;
  abstract deleteSession(id: string): Promise<void>;
}
