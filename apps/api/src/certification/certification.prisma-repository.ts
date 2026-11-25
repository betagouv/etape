import { Injectable } from "@nestjs/common";

import { escapeLikePattern } from "../common/like-pattern.js";
import { PrismaService } from "../database/prisma.service.js";
import type { Prisma } from "../generated/prisma/client.ts";
import { CertificationRepository } from "./certification.repository.js";
import type {
  Certificateur,
  CertificationSearchResult,
  ImportedCertification,
  RepertoireCertification,
  StatutCertification,
} from "./certification.types.js";

// Un import écrit 30 000 fiches et 43 000 certificateurs : les 5 s par défaut de Prisma sont pensées pour une requête d'écran.
const TRANSACTION_TIMEOUT_MS = 120_000;

interface CertificationRow {
  numeroFiche: string;
  repertoire: RepertoireCertification;
  intitule: string;
  abrege: string | null;
  niveau: number | null;
  certificateurs: Certificateur[];
  certificationCount: number;
}

@Injectable()
export class PrismaCertificationRepository extends CertificationRepository {
  // Dans une transaction, les requêtes passent par le client de la transaction.
  private client: Prisma.TransactionClient;

  constructor(private readonly prisma: PrismaService) {
    super();
    this.client = prisma;
  }

  transaction<T>(run: (repository: CertificationRepository) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(
      (transaction) => {
        const repository = new PrismaCertificationRepository(this.prisma);
        repository.client = transaction;
        return run(repository);
      },
      { timeout: TRANSACTION_TIMEOUT_MS },
    );
  }

  async searchCertifications(
    words: string[],
    statut: StatutCertification,
    limit: number,
  ): Promise<CertificationSearchResult> {
    const patterns = words.map(escapeLikePattern);
    const [firstPattern = ""] = patterns;

    // SQL brut : Prisma ne sait pas appeler `unaccent`. Les noms des certificateurs entrent dans le
    // texte cherché : 908 fiches actives partagent leur intitulé, seul l'organisme les distingue.
    // L'abrégé précède l'intitulé, comme à l'écran (« BP Boulanger »), pour le tri.
    const rows = await this.client.$queryRaw<CertificationRow[]>`
      select certification.numero_fiche as "numeroFiche",
             certification.repertoire::text as repertoire,
             certification.intitule, certification.abrege,
             certification.niveau::int as niveau,
             coalesce(certificateurs.liste, '[]'::jsonb) as certificateurs,
             count(*) over ()::int as "certificationCount"
      from certification
      left join lateral (
        select jsonb_agg(jsonb_build_object('siret', siret, 'nom', nom) order by nom) as liste,
               string_agg(nom, ' ') as noms
        from certificateur
        where certificateur.certification_id = certification.id
      ) as certificateurs on true
      where certification.statut = ${statut}::"StatutCertification"
        and lower(unaccent(concat_ws(' ', certification.numero_fiche, certification.abrege,
                                     certification.intitule, certificateurs.noms)))
            like all (
              select '%' || lower(unaccent(pattern)) || '%'
              from unnest(${patterns}::text[]) as pattern
            )
      order by lower(unaccent(concat_ws(' ', certification.abrege, certification.intitule)))
                 like lower(unaccent(${firstPattern})) || '%' desc,
               lower(unaccent(concat_ws(' ', certification.abrege, certification.intitule))),
               certification.numero_fiche
      limit ${limit}
    `;

    return {
      certificationCount: rows[0]?.certificationCount ?? 0,
      certifications: rows.map(
        ({ numeroFiche, repertoire, intitule, abrege, niveau, certificateurs }) => ({
          numeroFiche,
          repertoire,
          intitule,
          abrege,
          niveau,
          certificateurs,
        }),
      ),
    };
  }

  async hasCertification(): Promise<boolean> {
    return (await this.client.certification.findFirst({ select: { id: true } })) !== null;
  }

  async saveCertifications(certifications: ImportedCertification[]): Promise<void> {
    const rows = JSON.stringify(
      certifications.map(({ numeroFiche, repertoire, intitule, abrege, niveau, statut }) => ({
        numeroFiche,
        repertoire,
        intitule,
        abrege,
        niveau,
        statut,
      })),
    );

    // SQL brut : Prisma ne sait pas créer ou mettre à jour des lignes en masse. Le `where` final ne
    // touche que les lignes qui changent : `updated_at` date leur dernière modification réelle.
    await this.client.$executeRaw`
      insert into certification (numero_fiche, repertoire, intitule, abrege, niveau, statut)
      select ligne."numeroFiche", ligne.repertoire::"RepertoireCertification", ligne.intitule,
             ligne.abrege, ligne.niveau, ligne.statut::"StatutCertification"
      from jsonb_to_recordset(${rows}::jsonb) as ligne(
        "numeroFiche" text, repertoire text, intitule text, abrege text, niveau smallint, statut text
      )
      on conflict (numero_fiche) do update set
        repertoire = excluded.repertoire,
        intitule   = excluded.intitule,
        abrege     = excluded.abrege,
        niveau     = excluded.niveau,
        statut     = excluded.statut,
        updated_at = now()
      where (certification.repertoire, certification.intitule, certification.abrege,
             certification.niveau, certification.statut)
            is distinct from
            (excluded.repertoire, excluded.intitule, excluded.abrege, excluded.niveau,
             excluded.statut)
    `;
  }

  async saveCertificateurs(certifications: ImportedCertification[]): Promise<void> {
    // SQL brut, comme `saveCertifications`.
    await this.client.$executeRaw`
      insert into certificateur (certification_id, siret, nom)
      select certification.id, ligne.siret, ligne.nom
      from jsonb_to_recordset(${toCertificateurRows(certifications)}::jsonb) as ligne(
        "numeroFiche" text, siret text, nom text
      )
      join certification on certification.numero_fiche = ligne."numeroFiche"
      on conflict (certification_id, siret) do update set
        nom        = excluded.nom,
        updated_at = now()
      where certificateur.nom is distinct from excluded.nom
    `;
  }

  async deleteCertificateursExcept(certifications: ImportedCertification[]): Promise<void> {
    const numerosFiche = certifications.map(({ numeroFiche }) => numeroFiche);

    // SQL brut : une suppression par couple (fiche, SIRET) absent, que Prisma n'exprime pas en une requête.
    await this.client.$executeRaw`
      delete from certificateur
      using certification
      where certification.id = certificateur.certification_id
        and certification.numero_fiche = any(${numerosFiche}::text[])
        and (certification.numero_fiche, certificateur.siret) not in (
          select ligne."numeroFiche", ligne.siret
          from jsonb_to_recordset(${toCertificateurRows(certifications)}::jsonb) as ligne(
            "numeroFiche" text, siret text
          )
        )
    `;
  }
}

function toCertificateurRows(certifications: ImportedCertification[]): string {
  return JSON.stringify(
    certifications.flatMap(({ numeroFiche, certificateurs }) =>
      certificateurs.map(({ siret, nom }) => ({ numeroFiche, siret, nom })),
    ),
  );
}
