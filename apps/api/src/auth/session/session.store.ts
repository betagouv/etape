import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../base-de-donnees/prisma.service.js";
import { Prisma } from "../../generated/prisma/client.ts";
import type { LoginTransaction, SessionAOuvrir, UserSession } from "./session.types.js";

/**
 * Le navigateur ne reçoit qu'un identifiant opaque : la session reste révocable,
 * et l'`id_token` ne transite pas dans un cookie, où il dépasserait les 4 Ko.
 */
export abstract class SessionStore {
  abstract createTransaction(id: string, transaction: LoginTransaction): Promise<void>;
  /** Lecture unique : une transaction consommée ne se rejoue pas. */
  abstract consumeTransaction(id: string): Promise<LoginTransaction | null>;

  abstract createSession(id: string, session: SessionAOuvrir): Promise<void>;
  abstract getSession(id: string): Promise<UserSession | null>;
  abstract deleteSession(id: string): Promise<void>;
}

/** Ligne absente : `delete` de Prisma lève, là où `findUnique` rend `null`. */
function estIntrouvable(erreur: unknown): boolean {
  return erreur instanceof Prisma.PrismaClientKnownRequestError && erreur.code === "P2025";
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

  async createTransaction(id: string, transaction: LoginTransaction): Promise<void> {
    await this.purger();

    await this.prisma.transactionConnexion.create({
      data: {
        id,
        state: transaction.state,
        nonce: transaction.nonce,
        codeVerifier: transaction.codeVerifier,
        returnTo: transaction.returnTo,
        expiresAt: new Date(transaction.expiresAt),
      },
    });
  }

  /**
   * L'unicité de la lecture est tenue par la base, pas par le code : c'est le
   * `delete` qui la garantit, y compris si deux requêtes arrivent ensemble.
   */
  async consumeTransaction(id: string): Promise<LoginTransaction | null> {
    const ligne = await this.prisma.transactionConnexion.delete({ where: { id } }).catch(
      // Seule l'absence est un cas normal ; une base en panne doit remonter.
      (erreur: unknown) => {
        if (estIntrouvable(erreur)) return null;
        throw erreur;
      },
    );

    if (!ligne || ligne.expiresAt.getTime() <= Date.now()) return null;

    return {
      state: ligne.state,
      nonce: ligne.nonce,
      codeVerifier: ligne.codeVerifier,
      returnTo: ligne.returnTo,
      expiresAt: ligne.expiresAt.getTime(),
    };
  }

  async createSession(id: string, session: SessionAOuvrir): Promise<void> {
    await this.purger();

    await this.prisma.session.create({
      data: {
        id,
        utilisateurId: session.utilisateurId,
        fournisseurIdentite: session.fournisseurIdentite,
        claims: session.claims as Prisma.InputJsonValue,
        idToken: session.idToken,
        expiresAt: new Date(session.expiresAt),
      },
    });
  }

  /** `sub` et `email` viennent du compte lié : la session n'en garde pas de copie. */
  async getSession(id: string): Promise<UserSession | null> {
    const ligne = await this.prisma.session.findUnique({
      where: { id },
      include: { utilisateur: true },
    });

    if (!ligne) return null;

    if (ligne.expiresAt.getTime() <= Date.now()) {
      await this.deleteSession(id);
      return null;
    }

    return {
      sub: ligne.utilisateur.keycloakSub,
      utilisateurId: ligne.utilisateurId,
      email: ligne.utilisateur.email ?? undefined,
      fournisseurIdentite: ligne.fournisseurIdentite,
      claims: ligne.claims as Record<string, unknown>,
      idToken: ligne.idToken,
      expiresAt: ligne.expiresAt.getTime(),
    };
  }

  /** `deleteMany` et non `delete` : se déconnecter deux fois n'est pas une erreur. */
  async deleteSession(id: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { id } });
  }

  /**
   * Balayage des lignes expirées, à l'écriture. Elles ne sont de toute façon
   * jamais rendues — les lectures vérifient la date —, donc c'est du ménage et
   * non de la correction : rien ne dépend de son passage.
   *
   * À l'écriture, et pas sur une minuterie : on n'écrit qu'à la connexion, ce
   * qui est rare, et une tâche périodique demanderait `@nestjs/schedule` et un
   * verrou pour ne pas tourner deux fois sur deux instances.
   */
  private async purger(): Promise<void> {
    const maintenant = new Date();

    await Promise.all([
      this.prisma.transactionConnexion.deleteMany({ where: { expiresAt: { lte: maintenant } } }),
      this.prisma.session.deleteMany({ where: { expiresAt: { lte: maintenant } } }),
    ]);
  }
}
