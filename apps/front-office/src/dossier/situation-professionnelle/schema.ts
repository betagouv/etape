import { EtablissementSchema } from "@etape/api-contract";
import { z } from "zod";

export const DEMISSION = {
  OUI: "oui",
  NON: "non",
} as const;

export type Demission = (typeof DEMISSION)[keyof typeof DEMISSION];

export const DEMISSION_LABEL: Record<Demission, string> = {
  [DEMISSION.OUI]: "Oui",
  [DEMISSION.NON]: "Non",
};

export const situationProfessionnelleSchema = z.object({
  employeur: EtablissementSchema.nullable().refine((value) => value !== null, {
    message: "Veuillez choisir votre employeur.",
  }),
  intitulePoste: z.string().trim().min(1, "Veuillez saisir l’intitulé de votre poste."),
  demission: z.enum(DEMISSION, "Veuillez indiquer si vous avez remis votre démission."),
});

/** Saisie en cours : l'employeur peut manquer. */
export type SituationProfessionnelleFormValues = z.input<typeof situationProfessionnelleSchema>;

/** Après validation : l'employeur est choisi. */
export type SituationProfessionnelleFormData = z.output<typeof situationProfessionnelleSchema>;

type SituationProfessionnelleFieldName = keyof SituationProfessionnelleFormValues;

export const SITUATION_PROFESSIONNELLE_SECTION = {
  EMPLOI: "emploi",
  DEMISSION: "demission",
} as const;

export type SituationProfessionnelleSection =
  (typeof SITUATION_PROFESSIONNELLE_SECTION)[keyof typeof SITUATION_PROFESSIONNELLE_SECTION];

export const SITUATION_PROFESSIONNELLE_SECTION_FIELDS: Record<
  SituationProfessionnelleSection,
  readonly SituationProfessionnelleFieldName[]
> = {
  [SITUATION_PROFESSIONNELLE_SECTION.EMPLOI]: ["employeur", "intitulePoste"],
  [SITUATION_PROFESSIONNELLE_SECTION.DEMISSION]: ["demission"],
};
