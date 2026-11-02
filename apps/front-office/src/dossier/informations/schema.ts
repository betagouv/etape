import { z } from "zod";

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
  dateNaissance: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Le format attendu est JJ/MM/AAAA."),
  nationalite: z.string().min(1, "Veuillez choisir une nationalité."),
  numeroSecuriteSociale: z.string().regex(/^\d{13}$/, "Le numéro doit comporter 13 chiffres."),
  cle: z.string().regex(/^\d{2}$/, "La clé doit comporter 2 chiffres."),
  telephone: z.string().min(1, "Veuillez saisir un numéro de téléphone."),
});

export type InformationsFormData = z.infer<typeof informationsSchema>;
