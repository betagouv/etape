/**
 * Sur quoi porte une règle de la matrice : la relation qui doit exister entre
 * l'acteur et la cible pour que la règle s'applique.
 */
export const PORTEE = {
  /** Le bénéficiaire, sur son propre dossier. Pas d'habilitation : une relation. */
  PROPRIETAIRE: "proprietaire",
  /** Une habilitation du rôle demandé, sur la région de la cible. */
  REGION: "region",
  /** Membre de la commission où le dossier est inscrit, habilité dans sa région. */
  COMMISSION: "commission",
  /** Toutes les régions : réservé au super admin. */
  NATIONAL: "national",
} as const;

export type Portee = (typeof PORTEE)[keyof typeof PORTEE];
