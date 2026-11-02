import { parse } from "date-fns";
import { z } from "zod";

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

export const informationsSchema = z.object({
  civilite: z.enum(["madame", "monsieur"]),
  dateNaissance: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Le format attendu est JJ/MM/AAAA.")
    .refine(isAgeSuffisant, "Vous devez avoir au moins 18 ans.")
    .refine(isAgeMaximumRespected, "Vous devez avoir moins de 70 ans."),
  nationalite: z.string().min(1, "Veuillez choisir une nationalité."),
  numeroSecuriteSociale: z.string().regex(/^\d{13}$/, "Le numéro doit comporter 13 chiffres."),
  cle: z.string().regex(/^\d{2}$/, "La clé doit comporter 2 chiffres."),
  telephone: z
    .string()
    .min(1, "Veuillez saisir un numéro de téléphone.")
    .regex(/^\d{2}( \d{2}){4}$/, "Le numéro doit comporter 10 chiffres."),
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
