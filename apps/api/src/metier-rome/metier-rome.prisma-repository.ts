import { Injectable } from "@nestjs/common";

import { PrismaService } from "../database/prisma.service.js";
import { Prisma } from "../generated/prisma/client.ts";
import { MetierRomeRepository } from "./metier-rome.repository.js";
import type { MetierRome, VersionRome } from "./metier-rome.types.js";

// Un import écrit 16 000 lignes : les 5 s par défaut de Prisma sont pensées pour une requête d'écran.
const TRANSACTION_TIMEOUT_MS = 60_000;

@Injectable()
export class PrismaMetierRomeRepository extends MetierRomeRepository {
  // Dans une transaction, les requêtes passent par le client de la transaction.
  private client: Prisma.TransactionClient;

  constructor(private readonly prisma: PrismaService) {
    super();
    this.client = prisma;
  }

  transaction<T>(run: (repository: MetierRomeRepository) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(
      (transaction) => {
        const repository = new PrismaMetierRomeRepository(this.prisma);
        repository.client = transaction;
        return run(repository);
      },
      { timeout: TRANSACTION_TIMEOUT_MS },
    );
  }

  async findCurrentVersionRome(): Promise<VersionRome | null> {
    const row = await this.client.versionRome.findFirst({
      orderBy: { createdAt: Prisma.SortOrder.desc },
    });

    return row && { version: row.version, dateModification: row.dateModification };
  }

  async saveMetiersRome(metiers: MetierRome[]): Promise<void> {
    const metierRows = JSON.stringify(metiers.map(({ code, libelle }) => ({ code, libelle })));
    const appellationRows = JSON.stringify(
      metiers.flatMap((metier) =>
        metier.appellations.map(({ code, libelle, libelleCourt, classification }) => ({
          code,
          codeMetier: metier.code,
          libelle,
          libelleCourt,
          classification,
        })),
      ),
    );

    // SQL brut : Prisma ne sait pas créer ou mettre à jour des lignes en masse. Le `where` final ne
    // touche que les lignes qui changent : `updated_at` date leur dernière modification réelle.
    await this.client.$executeRaw`
      insert into metier_rome (code, libelle)
      select ligne.code, ligne.libelle
      from jsonb_to_recordset(${metierRows}::jsonb) as ligne(code text, libelle text)
      on conflict (code) do update set
        libelle     = excluded.libelle,
        is_obsolete = false,
        updated_at  = now()
      where (metier_rome.libelle, metier_rome.is_obsolete)
            is distinct from
            (excluded.libelle, false)
    `;

    await this.client.$executeRaw`
      insert into appellation_rome (code, metier_rome_id, libelle, libelle_court, classification)
      select ligne.code, metier_rome.id, ligne.libelle, ligne."libelleCourt",
             ligne.classification::"ClassificationAppellationRome"
      from jsonb_to_recordset(${appellationRows}::jsonb) as ligne(
        code text, "codeMetier" text, libelle text, "libelleCourt" text, classification text
      )
      join metier_rome on metier_rome.code = ligne."codeMetier"
      on conflict (code) do update set
        metier_rome_id = excluded.metier_rome_id,
        libelle        = excluded.libelle,
        libelle_court  = excluded.libelle_court,
        classification = excluded.classification,
        is_obsolete    = false,
        updated_at     = now()
      where (appellation_rome.metier_rome_id, appellation_rome.libelle, appellation_rome.libelle_court,
             appellation_rome.classification, appellation_rome.is_obsolete)
            is distinct from
            (excluded.metier_rome_id, excluded.libelle, excluded.libelle_court,
             excluded.classification, false)
    `;
  }

  async markMetiersRomeObsoleteExcept(codes: string[]): Promise<void> {
    await this.client.metierRome.updateMany({
      where: { isObsolete: false, code: { notIn: codes } },
      data: { isObsolete: true, updatedAt: new Date() },
    });
  }

  async markAppellationsRomeObsoleteExcept(codes: string[]): Promise<void> {
    await this.client.appellationRome.updateMany({
      where: { isObsolete: false, code: { notIn: codes } },
      data: { isObsolete: true, updatedAt: new Date() },
    });
  }

  async saveVersionRome({ version, dateModification }: VersionRome): Promise<void> {
    await this.client.versionRome.upsert({
      where: { version },
      create: { version, dateModification },
      update: { dateModification, createdAt: new Date() },
    });
  }
}
