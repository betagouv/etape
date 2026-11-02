import { parse } from "date-fns";
import { z } from "zod";

import { isCleNirValid, NIR_PATTERN } from "./domain/validate-nir";

const AGE_MINIMUM = 18;
const AGE_MAXIMUM = 70;
const REFERENCE_DATE = new Date(0);

function isAgeSuffisant(value: string): boolean {
  const date = parse(value, "dd/MM/yyyy", REFERENCE_DATE);
  if (isNaN(date.getTime())) return false;
  const today = new Date();
  const limite = new Date(today.getFullYear() - AGE_MINIMUM, today.getMonth(), today.getDate());
  return date <= limite;
}

function isAgeMaximumRespected(value: string): boolean {
  const date = parse(value, "dd/MM/yyyy", REFERENCE_DATE);
  if (isNaN(date.getTime())) return false;
  const today = new Date();
  const limite = new Date(today.getFullYear() - AGE_MAXIMUM, today.getMonth(), today.getDate());
  return date >= limite;
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
  civilite: z.enum(["madame", "monsieur"]),
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
    .regex(/^\d{2}( \d{2}){4}$/, "Le numéro doit comporter 10 chiffres."),
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

export const SECTION_IDENTITE_FIELDS: readonly InformationsFieldName[] = [
  "civilite",
  "dateNaissance",
  "nationalite",
  "numeroSecuriteSociale",
  "cle",
];

export const SECTION_CONTACT_FIELDS: readonly InformationsFieldName[] = ["telephone"];
