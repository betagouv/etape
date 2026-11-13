/** Classification d'une appellation : une seule `PRINCIPALE` par métier. */
export const CLASSIFICATION_APPELLATION_ROME = {
  PRINCIPALE: "PRINCIPALE",
  SYNONYME: "SYNONYME",
} as const;

export type ClassificationAppellationRome =
  (typeof CLASSIFICATION_APPELLATION_ROME)[keyof typeof CLASSIFICATION_APPELLATION_ROME];

/** Intitulé rattaché à un seul métier ROME. */
export interface AppellationRome {
  code: string;
  libelle: string;
  libelleCourt: string;
  classification: ClassificationAppellationRome;
}

/** Métier du référentiel ROME de France Travail, avec ses appellations. */
export interface MetierRome {
  code: string;
  libelle: string;
  appellations: AppellationRome[];
}

/** Version du ROME telle que France Travail la publie. */
export interface VersionRome {
  version: string;
  dateModification: Date;
}
