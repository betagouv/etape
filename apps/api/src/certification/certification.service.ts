import { Injectable, Logger } from "@nestjs/common";

import { CertificationRepository } from "./certification.repository.js";
import { STATUT_CERTIFICATION, type CertificationSearchResult } from "./certification.types.js";
import { FranceCompetencesClient } from "./france-competences.client.js";

const SEARCH_RESULT_LIMIT = 20;

const NO_CERTIFICATION: CertificationSearchResult = {
  certificationCount: 0,
  certifications: [],
};

/** Tient la copie locale des répertoires RNCP et RS au dernier export de France compétences, et y cherche. */
@Injectable()
export class CertificationService {
  private readonly logger = new Logger(CertificationService.name);

  constructor(
    private readonly franceCompetencesClient: FranceCompetencesClient,
    private readonly certificationRepository: CertificationRepository,
  ) {}

  /**
   * Chaque mot de la saisie doit figurer dans la fiche, dans n'importe quel ordre. Seule une fiche
   * active se délivre encore : les inactives ne sont pas proposées.
   */
  async searchCertifications(search: string): Promise<CertificationSearchResult> {
    const words = search.split(/\s+/).filter(Boolean);
    if (words.length === 0) return NO_CERTIFICATION;

    return this.certificationRepository.searchCertifications(
      words,
      STATUT_CERTIFICATION.ACTIVE,
      SEARCH_RESULT_LIMIT,
    );
  }

  /** Premier remplissage : ne télécharge rien dès qu'une fiche est en base. */
  async syncCertificationsIfEmpty(): Promise<void> {
    if (await this.certificationRepository.hasCertification()) return;

    await this.syncCertifications();
  }

  /** Une fiche absente de l'export garde son dernier état : l'export contient déjà les inactives. */
  async syncCertifications(): Promise<void> {
    const certifications = await this.franceCompetencesClient.fetchCertifications();
    if (certifications.length === 0) {
      throw new Error("France compétences a publié un export de certifications vide");
    }

    await this.certificationRepository.transaction(async (repository) => {
      await repository.saveCertifications(certifications);
      await repository.saveCertificateurs(certifications);
      await repository.deleteCertificateursExcept(certifications);
    });

    const activeCount = certifications.filter(
      ({ statut }) => statut === STATUT_CERTIFICATION.ACTIVE,
    ).length;
    this.logger.log(
      `Certifications importées : ${certifications.length} fiches, dont ${activeCount} actives.`,
    );
  }
}
