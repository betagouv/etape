/** Classification d'une appellation : une seule `PRINCIPALE` par métier. */
export const CLASSIFICATION_APPELLATION_ROME = {
  PRINCIPALE: "PRINCIPALE",
  SYNONYME: "SYNONYME",
} as const;

export type ClassificationAppellationRome =
  (typeof CLASSIFICATION_APPELLATION_ROME)[keyof typeof CLASSIFICATION_APPELLATION_ROME];

/** Appellation telle que France Travail la publie : intitulé rattaché à un seul métier ROME. */
export interface ImportedAppellationRome {
  code: string;
  libelle: string;
  libelleCourt: string;
  classification: ClassificationAppellationRome;
}

/** Métier du référentiel ROME de France Travail, avec ses appellations. */
export interface MetierRome {
  code: string;
  libelle: string;
  appellations: ImportedAppellationRome[];
}

/** Appellation trouvée par une recherche, avec le métier auquel elle est rattachée. */
export interface FoundAppellationRome {
  code: string;
  libelle: string;
  metierRome: Pick<MetierRome, "code" | "libelle">;
}

/** `appellationRomeCount` compte toutes les appellations trouvées, au-delà de celles rendues. */
export interface AppellationRomeSearchResult {
  appellationRomeCount: number;
  appellationsRome: FoundAppellationRome[];
}

/** Version du ROME telle que France Travail la publie. */
export interface VersionRome {
  version: string;
  dateModification: Date;
}
