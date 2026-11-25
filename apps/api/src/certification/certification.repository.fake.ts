import { normalizeForSearch } from "@etape/utils/text";

import type { CertificationRepository } from "./certification.repository.js";
import {
  STATUT_CERTIFICATION,
  type Certificateur,
  type CertificationSearchResult,
  type ImportedCertification,
} from "./certification.types.js";

type StoredCertification = Omit<ImportedCertification, "numeroFiche" | "certificateurs">;

/**
 * Double de test : les répertoires en mémoire, écrits comme la base les écrit.
 * Exclu du build (`tsconfig.build.json`).
 */
export class FakeCertificationRepository implements CertificationRepository {
  readonly certifications = new Map<string, StoredCertification>();
  /** Par numéro de fiche, puis par SIRET. */
  readonly certificateurs = new Map<string, Map<string, string>>();

  async searchCertifications(words: string[], limit: number): Promise<CertificationSearchResult> {
    const searchedWords = words.map(normalizeForSearch);
    const [firstWord = ""] = searchedWords;

    const found = [...this.certifications]
      .filter(([, { statut }]) => statut === STATUT_CERTIFICATION.ACTIVE)
      .map(([numeroFiche, { repertoire, intitule, abrege, niveau }]) => {
        const certificateurs = this.listCertificateurs(numeroFiche);
        const displayed = [abrege, intitule].filter(Boolean).join(" ");
        const searched = [numeroFiche, displayed, ...certificateurs.map(({ nom }) => nom)].join(
          " ",
        );

        return {
          sortKey: normalizeForSearch(displayed),
          searchKey: normalizeForSearch(searched),
          certification: { numeroFiche, repertoire, intitule, abrege, niveau, certificateurs },
        };
      })
      .filter(({ searchKey }) => searchedWords.every((word) => searchKey.includes(word)))
      .sort(
        (a, b) =>
          Number(b.sortKey.startsWith(firstWord)) - Number(a.sortKey.startsWith(firstWord)) ||
          a.sortKey.localeCompare(b.sortKey) ||
          a.certification.numeroFiche.localeCompare(b.certification.numeroFiche),
      );

    return {
      certificationCount: found.length,
      certifications: found.slice(0, limit).map(({ certification }) => certification),
    };
  }

  async hasCertification(): Promise<boolean> {
    return this.certifications.size > 0;
  }

  async saveCertifications(certifications: ImportedCertification[]): Promise<void> {
    for (const { numeroFiche, repertoire, intitule, abrege, niveau, statut } of certifications) {
      this.certifications.set(numeroFiche, { repertoire, intitule, abrege, niveau, statut });
    }
  }

  async saveCertificateurs(certifications: ImportedCertification[]): Promise<void> {
    for (const { numeroFiche, certificateurs } of certifications) {
      if (!this.certifications.has(numeroFiche)) continue;

      const stored = this.certificateurs.get(numeroFiche) ?? new Map<string, string>();
      for (const { siret, nom } of certificateurs) stored.set(siret, nom);
      this.certificateurs.set(numeroFiche, stored);
    }
  }

  async deleteCertificateursExcept(certifications: ImportedCertification[]): Promise<void> {
    for (const { numeroFiche, certificateurs } of certifications) {
      const kept = new Set(certificateurs.map(({ siret }) => siret));
      for (const siret of this.certificateurs.get(numeroFiche)?.keys() ?? []) {
        if (!kept.has(siret)) this.certificateurs.get(numeroFiche)?.delete(siret);
      }
    }
  }

  transaction<T>(run: (repository: CertificationRepository) => Promise<T>): Promise<T> {
    return run(this);
  }

  /** Triés par nom, comme la base les agrège. */
  listCertificateurs(numeroFiche: string): Certificateur[] {
    return [...(this.certificateurs.get(numeroFiche) ?? [])]
      .map(([siret, nom]) => ({ siret, nom }))
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }
}
