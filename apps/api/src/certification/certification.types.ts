/** Répertoire de France compétences où la fiche est enregistrée, lu dans le préfixe de son numéro. */
export const REPERTOIRE_CERTIFICATION = {
  RNCP: "RNCP",
  RS: "RS",
} as const;

export type RepertoireCertification =
  (typeof REPERTOIRE_CERTIFICATION)[keyof typeof REPERTOIRE_CERTIFICATION];

/** Valeurs de la colonne `Actif` de l'export : seule une fiche active se délivre encore. */
export const STATUT_CERTIFICATION = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export type StatutCertification = (typeof STATUT_CERTIFICATION)[keyof typeof STATUT_CERTIFICATION];

/** Organisme qui délivre la certification, identifié par son SIRET. */
export interface Certificateur {
  siret: string;
  nom: string;
}

/** Fiche du RNCP ou du RS telle que France compétences la publie, avec ses certificateurs. */
export interface ImportedCertification {
  numeroFiche: string;
  repertoire: RepertoireCertification;
  intitule: string;
  abrege: string | null;
  niveau: number | null;
  statut: StatutCertification;
  certificateurs: Certificateur[];
}

/** Fiche active trouvée par une recherche. */
export type FoundCertification = Omit<ImportedCertification, "statut">;

/** `certificationCount` compte toutes les fiches trouvées, au-delà de celles rendues. */
export interface CertificationSearchResult {
  certificationCount: number;
  certifications: FoundCertification[];
}
