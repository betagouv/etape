import { z } from "zod";

import {
  AGE_MAXIMUM,
  AGE_MINIMUM,
  computeDateNaissanceBounds,
  parseDateNaissance,
} from "./domain/date-naissance";
import { isCleNirValid, NIR_PATTERN } from "./domain/validate-nir";

function isAgeMinimumRespected(value: string): boolean {
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

const CLE_NIR_PATTERN = /^\d{2}$/;

const baseInformationsSchema = z.object({
  civilite: z.enum(CIVILITE, "Veuillez indiquer votre civilité."),
  dateNaissance: z
    .string()
    .min(1, "Veuillez indiquer votre date de naissance.")
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Le format attendu est JJ/MM/AAAA.")
    .refine(isAgeMinimumRespected, `Vous devez avoir au moins ${AGE_MINIMUM} ans.`)
    .refine(isAgeMaximumRespected, `Vous devez avoir moins de ${AGE_MAXIMUM} ans.`),
  nationalite: z.string().min(1, "Veuillez choisir une nationalité."),
  nir: z
    .string()
    .min(1, "Veuillez saisir votre numéro de sécurité sociale.")
    .regex(NIR_PATTERN, "Saisissez les 13 premiers chiffres qui figurent sur votre carte Vitale."),
  cleNir: z
    .string()
    .min(1, "Veuillez saisir la clé de votre numéro de sécurité sociale.")
    .regex(
      CLE_NIR_PATTERN,
      "Saisissez les 2 derniers chiffres qui figurent sur votre carte Vitale.",
    ),
  telephone: z
    .string()
    .min(1, "Veuillez saisir un numéro de téléphone.")
    .regex(/^\d{2}( \d{2}){4}$/, "Le numéro doit comporter 10 chiffres.")
    .regex(/^0[1-79]/, "Le numéro doit être un téléphone français (fixe ou mobile)."),
});

const nirCleSchema = baseInformationsSchema.pick({ nir: true, cleNir: true });

export const informationsSchema = baseInformationsSchema.superRefine(
  (data, ctx) => {
    if (!isCleNirValid(data.nir, data.cleNir)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "La clé ne correspond pas au numéro : vérifiez les 2 derniers chiffres de votre carte Vitale.",
        path: ["cleNir"],
      });
    }
  },
  {
    // Sans `when`, zod saute ce contrôle dès qu'un champ est rejeté d'emblée : une civilité
    // vide suffisait à laisser passer une clé fausse.
    when: ({ value }) => nirCleSchema.safeParse(value).success,
  },
);

export type InformationsFormData = z.infer<typeof informationsSchema>;

export type InformationsFieldName = keyof InformationsFormData;

/** Libellés des champs, partagés par le formulaire et l'annonce de leurs erreurs. */
export const INFORMATIONS_FIELD_LABEL: Record<InformationsFieldName, string> = {
  civilite: "Civilité",
  dateNaissance: "Date de naissance",
  nationalite: "Nationalité",
  nir: "Numéro de sécurité sociale",
  cleNir: "Clé",
  telephone: "Téléphone",
};

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
  [INFORMATIONS_SECTION.IDENTITE]: ["civilite", "dateNaissance", "nationalite", "nir", "cleNir"],
  [INFORMATIONS_SECTION.CONTACT]: ["telephone"],
};
