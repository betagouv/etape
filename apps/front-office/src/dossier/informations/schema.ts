import { z } from "zod";

import { computeDateNaissanceBounds, parseDateNaissance } from "./domain/date-naissance";
import { isCleNirValid, NIR_PATTERN } from "./domain/validate-nir";

function isAgeSuffisant(value: string): boolean {
  const date = parseDateNaissance(value);
  return date !== undefined && date <= computeDateNaissanceBounds(new Date()).max;
}

function isAgeMaximumRespected(value: string): boolean {
  const date = parseDateNaissance(value);
  return date !== undefined && date >= computeDateNaissanceBounds(new Date()).min;
}

export const CIVILITE = {
  MADAME: "madame",
  MONSIEUR: "monsieur",
} as const;

export type Civilite = (typeof CIVILITE)[keyof typeof CIVILITE];

export const CIVILITE_LABEL: Record<Civilite, string> = {
  [CIVILITE.MADAME]: "Madame",
  [CIVILITE.MONSIEUR]: "Monsieur",
};

const CLE_PATTERN = /^\d{2}$/;

const baseInformationsSchema = z.object({
  civilite: z.enum(CIVILITE, "Veuillez indiquer votre civilité."),
  dateNaissance: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Le format attendu est JJ/MM/AAAA.")
    .refine(isAgeSuffisant, "Vous devez avoir au moins 18 ans.")
    .refine(isAgeMaximumRespected, "Vous devez avoir moins de 70 ans."),
  nationalite: z.string().min(1, "Veuillez choisir une nationalité."),
  numeroSecuriteSociale: z
    .string()
    .min(1, "Veuillez saisir votre numéro de sécurité sociale.")
    .regex(NIR_PATTERN, "Le numéro de sécurité sociale n'est pas valide."),
  cle: z.string().regex(CLE_PATTERN, "La clé doit comporter 2 chiffres."),
  telephone: z
    .string()
    .min(1, "Veuillez saisir un numéro de téléphone.")
    .regex(/^\d{2}( \d{2}){4}$/, "Le numéro doit comporter 10 chiffres.")
    .regex(/^0[1-79]/, "Le numéro doit être un téléphone français (fixe ou mobile)."),
});

export const informationsSchema = baseInformationsSchema.superRefine((data, ctx) => {
  if (NIR_PATTERN.test(data.numeroSecuriteSociale) && CLE_PATTERN.test(data.cle)) {
    if (!isCleNirValid(data.numeroSecuriteSociale, data.cle)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La clé ne correspond pas au numéro de sécurité sociale.",
        path: ["cle"],
      });
    }
  }
});

export type InformationsFormData = z.infer<typeof informationsSchema>;

export type InformationsFieldName = keyof InformationsFormData;

export const INFORMATIONS_SECTION = {
  IDENTITE: "identite",
  CONTACT: "contact",
} as const;

export type InformationsSection = (typeof INFORMATIONS_SECTION)[keyof typeof INFORMATIONS_SECTION];

/** Champs obligatoires de chaque section ; les champs préremplis n'y figurent pas. */
export const INFORMATIONS_SECTION_FIELDS: Record<
  InformationsSection,
  readonly InformationsFieldName[]
> = {
  [INFORMATIONS_SECTION.IDENTITE]: [
    "civilite",
    "dateNaissance",
    "nationalite",
    "numeroSecuriteSociale",
    "cle",
  ],
  [INFORMATIONS_SECTION.CONTACT]: ["telephone"],
};
