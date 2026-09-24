import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../database/prisma.service.js";
import { Prisma } from "../../generated/prisma/client.ts";
import type { AccountSession, NewSession } from "./session.types.js";

/**
 * Le navigateur ne reçoit qu'un identifiant opaque : la session reste révocable,
 * et l'`id_token` ne transite pas dans un cookie, où il dépasserait les 4 Ko.
 */
export abstract class SessionStore {
  abstract createSession(id: string, session: NewSession): Promise<void>;
  abstract getSession(id: string): Promise<AccountSession | null>;
  abstract deleteSession(id: string): Promise<void>;
}

/**
 * Sessions en base plutôt qu'en mémoire : elles survivent au redéploiement, et
 * deux instances de l'API voient les mêmes. C'est ce qui rend l'API réellement
 * redémarrable sans déconnecter tout le monde.
 */
@Injectable()
export class PrismaSessionStore extends SessionStore {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async createSession(id: string, session: NewSession): Promise<void> {
    await this.purgeExpired();

    await this.prisma.session.create({
      data: {
        id,
        accountId: session.accountId,
        identityProvider: session.identityProvider,
        claims: session.claims as Prisma.InputJsonValue,
        idToken: session.idToken,
        expiresAt: new Date(session.expiresAt),
      },
    });
  }

  async getSession(id: string): Promise<AccountSession | null> {
    const row = await this.prisma.session.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!row) return null;

    if (row.expiresAt.getTime() <= Date.now()) {
      await this.deleteSession(id);
      return null;
    }

    return {
      sub: row.account.keycloakSub,
      accountId: row.accountId,
      email: row.account.email ?? undefined,
      identityProvider: row.identityProvider,
      claims: row.claims as Record<string, unknown>,
      idToken: row.idToken,
      expiresAt: row.expiresAt.getTime(),
    };
  }

  async deleteSession(id: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { id } });
  }

  private async purgeExpired(): Promise<void> {
    await this.prisma.session.deleteMany({ where: { expiresAt: { lte: new Date() } } });
  }
}
