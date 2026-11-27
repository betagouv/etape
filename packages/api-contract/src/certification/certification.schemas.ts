import { z } from "zod";

export const CERTIFICATION_SEARCH_MIN_LENGTH = 3;
/** Au-delà, chaque mot ajouterait une comparaison à la requête. */
export const CERTIFICATION_SEARCH_MAX_LENGTH = 100;

/** Répertoire de France compétences où la fiche est enregistrée. */
export const REPERTOIRE_CERTIFICATION = {
  RNCP: "RNCP",
  RS: "RS",
} as const;

/** Des mots de l'intitulé, de l'abrégé, du numéro de fiche ou du certificateur, dans n'importe quel ordre. */
export const SearchCertificationsQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .min(CERTIFICATION_SEARCH_MIN_LENGTH)
    .max(CERTIFICATION_SEARCH_MAX_LENGTH),
});

export type SearchCertificationsQuery = z.infer<typeof SearchCertificationsQuerySchema>;

export const CertificateurSchema = z.object({
  siret: z.string(),
  nom: z.string(),
});

export type Certificateur = z.infer<typeof CertificateurSchema>;

/** Fiche active du RNCP ou du RS ; `niveau` (2 à 8) est absent pour une fiche RS. */
export const CertificationSchema = z.object({
  numeroFiche: z.string(),
  repertoire: z.enum(REPERTOIRE_CERTIFICATION),
  intitule: z.string(),
  abrege: z.string().nullable(),
  niveau: z.number().int().nullable(),
  certificateurs: z.array(CertificateurSchema),
});

export type Certification = z.infer<typeof CertificationSchema>;

/** `certificationCount` compte toutes les fiches trouvées, au-delà de celles renvoyées. */
export const SearchCertificationsResponseSchema = z.object({
  certificationCount: z.number().int().nonnegative(),
  certifications: z.array(CertificationSchema),
});

export type SearchCertificationsResponse = z.infer<typeof SearchCertificationsResponseSchema>;
