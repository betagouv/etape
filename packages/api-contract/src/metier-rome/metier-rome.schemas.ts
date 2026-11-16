import { z } from "zod";

export const APPELLATION_ROME_SEARCH_MIN_LENGTH = 3;
/** Au-delà, chaque mot ajouterait une comparaison à la requête. */
export const APPELLATION_ROME_SEARCH_MAX_LENGTH = 100;

/** Des mots de l'intitulé recherché, dans n'importe quel ordre, avec ou sans accents. */
export const SearchAppellationsRomeQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .min(APPELLATION_ROME_SEARCH_MIN_LENGTH)
    .max(APPELLATION_ROME_SEARCH_MAX_LENGTH),
});

export type SearchAppellationsRomeQuery = z.infer<typeof SearchAppellationsRomeQuerySchema>;

/** Appellation du ROME de France Travail, avec le métier auquel elle est rattachée. */
export const AppellationRomeSchema = z.object({
  code: z.string(),
  libelle: z.string(),
  metierRome: z.object({
    code: z.string(),
    libelle: z.string(),
  }),
});

export type AppellationRome = z.infer<typeof AppellationRomeSchema>;

/** `appellationRomeCount` compte toutes les appellations trouvées, au-delà de celles renvoyées. */
export const SearchAppellationsRomeResponseSchema = z.object({
  appellationRomeCount: z.number().int().nonnegative(),
  appellationsRome: z.array(AppellationRomeSchema),
});

export type SearchAppellationsRomeResponse = z.infer<typeof SearchAppellationsRomeResponseSchema>;
