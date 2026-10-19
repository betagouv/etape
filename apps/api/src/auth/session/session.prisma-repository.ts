import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../database/prisma.service.js";
import { Prisma } from "../../generated/prisma/client.ts";
import { isFront } from "../front.js";
import { SessionRepository } from "./session.repository.js";
import type { AccountSession, NewSession } from "./session.types.js";

/**
 * Sessions en base plutôt qu'en mémoire : elles survivent au redéploiement, et
 * deux instances de l'API voient les mêmes. C'est ce qui rend l'API réellement
 * redémarrable sans déconnecter tout le monde.
 */
@Injectable()
export class PrismaSessionRepository extends SessionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async createSession(id: string, session: NewSession): Promise<void> {
    await this.purgeExpired();

    await this.prisma.session.create({
      data: {
        id,
        accountId: session.accountId,
        front: session.front,
        identityProvider: session.identityProvider,
        claims: session.claims as Prisma.InputJsonValue,
        idToken: session.idToken,
        expiresAt: new Date(session.expiresAt),
        idleExpiresAt: new Date(session.idleExpiresAt),
      },
    });
  }

  async getSession(id: string): Promise<AccountSession | null> {
    const row = await this.prisma.session.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!row) return null;

    const now = Date.now();
    if (row.expiresAt.getTime() <= now || row.idleExpiresAt.getTime() <= now) {
      await this.deleteSession(id);
      return null;
    }

    // Une valeur inconnue en base ne désigne aucun front : la session n'est
    // valable nulle part.
    if (!isFront(row.front)) return null;

    return {
      sub: row.account.keycloakSub,
      accountId: row.accountId,
      front: row.front,
      email: row.account.email ?? undefined,
      identityProvider: row.identityProvider,
      claims: row.claims as Record<string, unknown>,
      idToken: row.idToken,
      expiresAt: row.expiresAt.getTime(),
      idleExpiresAt: row.idleExpiresAt.getTime(),
    };
  }

  async extendSession(id: string, idleExpiresAt: number): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id },
      data: { idleExpiresAt: new Date(idleExpiresAt) },
    });
  }

  async deleteSession(id: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { id } });
  }

  private async purgeExpired(): Promise<void> {
    const now = new Date();
    await this.prisma.session.deleteMany({
      where: { OR: [{ expiresAt: { lte: now } }, { idleExpiresAt: { lte: now } }] },
    });
  }
}
