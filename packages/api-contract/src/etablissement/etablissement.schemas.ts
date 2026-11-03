import { z } from "zod";

export const ETABLISSEMENT_SEARCH_MIN_LENGTH = 3;

/** Un SIRET de 14 chiffres, ou des débuts de mots du nom et de la commune. */
export const SearchEtablissementsQuerySchema = z.object({
  search: z.string().trim().min(ETABLISSEMENT_SEARCH_MIN_LENGTH),
});

export type SearchEtablissementsQuery = z.infer<typeof SearchEtablissementsQuerySchema>;

/** Établissement tel que le répertoire Sirene de l'Insee le décrit. */
export const EtablissementSchema = z.object({
  siret: z.string(),
  denomination: z.string(),
  enseigne: z.string().nullable(),
  adresse: z.string(),
  /** `null` sans code d'activité ou hors NAF rév. 2 (ancienne nomenclature). */
  secteurActivite: z.string().nullable(),
});

export type Etablissement = z.infer<typeof EtablissementSchema>;

/** `etablissementCount` compte tous les résultats de Sirene, au-delà de ceux renvoyés. */
export const SearchEtablissementsResponseSchema = z.object({
  etablissementCount: z.number().int().nonnegative(),
  etablissements: z.array(EtablissementSchema),
});

export type SearchEtablissementsResponse = z.infer<typeof SearchEtablissementsResponseSchema>;
