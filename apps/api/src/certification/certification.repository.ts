import type { CertificationSearchResult, ImportedCertification } from "./certification.types.js";

/** Copie locale des répertoires RNCP et RS : France compétences fait foi, la base recopie. */
export abstract class CertificationRepository {
  /**
   * Les fiches actives dont le numéro, l'abrégé, l'intitulé ou un certificateur contient chaque
   * mot, sans tenir compte des accents ni de la casse : celles dont l'abrégé suivi de l'intitulé
   * commence par le premier mot d'abord, puis par ordre alphabétique. `limit` borne les fiches
   * rendues, pas leur décompte.
   */
  abstract searchCertifications(words: string[], limit: number): Promise<CertificationSearchResult>;
  /** Au moins une fiche en base. */
  abstract hasCertification(): Promise<boolean>;
  /** Crée ou met à jour chaque fiche par son numéro, sans toucher à ses certificateurs. */
  abstract saveCertifications(certifications: ImportedCertification[]): Promise<void>;
  /** Crée ou met à jour chaque certificateur d'une fiche par son SIRET ; la fiche doit exister. */
  abstract saveCertificateurs(certifications: ImportedCertification[]): Promise<void>;
  /** Retire de chaque fiche de `certifications` les certificateurs qu'elle ne liste pas. */
  abstract deleteCertificateursExcept(certifications: ImportedCertification[]): Promise<void>;
  /** Tout ou rien : les écritures de `run` passent par le repository qu'il reçoit. */
  abstract transaction<T>(run: (repository: CertificationRepository) => Promise<T>): Promise<T>;
}
