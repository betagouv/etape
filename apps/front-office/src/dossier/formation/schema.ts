import { CertificationSchema } from "@etape/api-contract";
import { z } from "zod";

import { ENTRY_MODE, type EntryMode } from "../domain/entry-mode";
import { requireFilled } from "../domain/require-filled";
import { LONGUEUR_MAX_TEXTE, LONGUEUR_MAX_TEXTE_MESSAGE } from "../domain/longueur-max-texte";
import {
  HORIZON_DATE_DEBUT_FORMATION_ANNEES,
  HORIZON_DATE_FIN_FORMATION_ANNEES,
  isDateDebutFormationAfterHorizon,
  isDateFinBeforeDebut,
  isDateFinFormationAfterHorizon,
  isDateFormationInPast,
} from "./domain/dates-formation";
import { formatNumeroFiche } from "./domain/format-numero-fiche";
import { HEURES_PAR_SEMAINE_MAX, parseHeures } from "./domain/heures-formation";
import { MODALITE_FORMATION } from "./domain/modalite-formation";
import { NIVEAU_CERTIFICATION } from "./domain/niveau-certification";

const NUMERO_FICHE_RNCP_PATTERN = /^RNCP\d+$/;

const REQUIRED_MESSAGES = {
  certificationVisee: "Veuillez choisir le diplôme, titre ou certificat délivré.",
  intituleCertificationVisee: "Veuillez saisir l’intitulé du diplôme, titre ou certificat.",
} as const;

type RequiredFieldName = keyof typeof REQUIRED_MESSAGES;

/** Les champs exigés par chaque mode : le code RNCP et le niveau de la saisie manuelle sont facultatifs (maquette 07). */
export const REQUIRED_CERTIFICATION_VISEE_FIELDS: Record<EntryMode, readonly RequiredFieldName[]> =
  {
    [ENTRY_MODE.SEARCH]: ["certificationVisee"],
    [ENTRY_MODE.MANUAL]: ["intituleCertificationVisee"],
  };

/** Un nombre d'heures entier, d'au moins une heure. */
function heuresSchema(requiredMessage: string, example: string) {
  return z
    .string()
    .trim()
    .min(1, requiredMessage)
    .refine(
      (value) => value === "" || parseHeures(value) !== undefined,
      `Indiquez un nombre entier d’heures, par exemple ${example}.`,
    )
    .refine((value) => parseHeures(value) !== 0, "Indiquez au moins 1 heure.");
}

/** Une date de la formation, choisie entre aujourd'hui et son horizon, en années. */
function dateFormationSchema(
  requiredMessage: string,
  isAfterHorizon: (value: string, today: Date) => boolean,
  horizonAnnees: number,
) {
  return z
    .string()
    .min(1, requiredMessage)
    .refine(
      (value) => !isDateFormationInPast(value, new Date()),
      "La formation ne doit pas avoir commencé : choisissez une date à partir d’aujourd’hui.",
    )
    .refine(
      (value) => !isAfterHorizon(value, new Date()),
      `Choisissez une date dans les ${horizonAnnees} ans à venir.`,
    );
}

const baseFormationSchema = z.object({
  intituleFormation: z.string().trim().min(1, "Veuillez saisir l’intitulé de la formation."),
  certificationViseeEntryMode: z.enum(ENTRY_MODE),
  certificationVisee: CertificationSchema.nullable(),
  intituleCertificationVisee: z.string().trim(),
  // Le champ n'est mis en forme qu'à sa sortie : un envoi par Entrée arrive avec la saisie brute.
  numeroFiche: z.string().transform(formatNumeroFiche),
  niveauCertification: z.enum(NIVEAU_CERTIFICATION).optional(),
  dureeFormation: heuresSchema("Veuillez indiquer la durée totale de la formation.", "400"),
  heuresParSemaine: heuresSchema("Veuillez indiquer le nombre d’heures par semaine.", "35").refine(
    (value) => (parseHeures(value) ?? 0) <= HEURES_PAR_SEMAINE_MAX,
    `Indiquez au plus ${HEURES_PAR_SEMAINE_MAX} heures par semaine.`,
  ),
  dateDebutFormation: dateFormationSchema(
    "Veuillez choisir la date de début de la formation.",
    isDateDebutFormationAfterHorizon,
    HORIZON_DATE_DEBUT_FORMATION_ANNEES,
  ),
  dateFinFormation: dateFormationSchema(
    "Veuillez choisir la date de fin de la formation.",
    isDateFinFormationAfterHorizon,
    HORIZON_DATE_FIN_FORMATION_ANNEES,
  ),
  modalitesFormation: z
    .array(z.enum(MODALITE_FORMATION))
    .min(1, "Veuillez indiquer comment se déroule la formation."),
  contenuFormation: z
    .string()
    .trim()
    .min(1, "Veuillez décrire le contenu de la formation.")
    .max(LONGUEUR_MAX_TEXTE, LONGUEUR_MAX_TEXTE_MESSAGE),
});

/** Les champs que lit le contrôle d'ensemble : il ne s'exécute que s'ils ont le bon type. */
const refinedFieldsSchema = baseFormationSchema
  .pick({
    certificationViseeEntryMode: true,
    certificationVisee: true,
    intituleCertificationVisee: true,
    numeroFiche: true,
  })
  .extend({ dateDebutFormation: z.string(), dateFinFormation: z.string() });

/**
 * Le schéma du formulaire « Ma formation » ; seuls les champs du mode de saisie du diplôme en
 * cours sont exigés, et la date de fin tombe après la date de début.
 */
export const formationSchema = baseFormationSchema.superRefine(
  (data, ctx) => {
    if (isDateFinBeforeDebut(data.dateFinFormation, data.dateDebutFormation)) {
      ctx.addIssue({
        code: "custom",
        path: ["dateFinFormation"],
        message: "La date de fin doit être après la date de début.",
      });
    }

    requireFilled(
      ctx,
      data,
      REQUIRED_CERTIFICATION_VISEE_FIELDS[data.certificationViseeEntryMode],
      REQUIRED_MESSAGES,
    );
    if (data.certificationViseeEntryMode === ENTRY_MODE.SEARCH) return;

    // Facultatif : contrôlé seulement s'il est rempli.
    if (data.numeroFiche !== "" && !NUMERO_FICHE_RNCP_PATTERN.test(data.numeroFiche)) {
      ctx.addIssue({
        code: "custom",
        path: ["numeroFiche"],
        message: "Le code RNCP comporte RNCP suivi de chiffres, par exemple RNCP12345.",
      });
    }
  },
  {
    // Sans `when`, zod saute ce contrôle dès qu'un champ est rejeté d'emblée : le diplôme
    // n'apparaîtrait qu'au second envoi.
    when: ({ value }) => refinedFieldsSchema.safeParse(value).success,
  },
);

/** Les valeurs du formulaire « Ma formation », telles que le schéma les valide. */
export type FormationFormData = z.infer<typeof formationSchema>;

/** Nom d'un champ du formulaire, tel que react-hook-form le connaît. */
export type FormationFieldName = keyof FormationFormData;

/** Les noms des champs du volet, pour `setValue`, `useWatch` et les `name` des champs. */
export const FORMATION_FIELD = {
  INTITULE_FORMATION: "intituleFormation",
  CERTIFICATION_VISEE_ENTRY_MODE: "certificationViseeEntryMode",
  CERTIFICATION_VISEE: "certificationVisee",
  INTITULE_CERTIFICATION_VISEE: "intituleCertificationVisee",
  NUMERO_FICHE: "numeroFiche",
  NIVEAU_CERTIFICATION: "niveauCertification",
  DUREE_FORMATION: "dureeFormation",
  HEURES_PAR_SEMAINE: "heuresParSemaine",
  DATE_DEBUT_FORMATION: "dateDebutFormation",
  DATE_FIN_FORMATION: "dateFinFormation",
  MODALITES_FORMATION: "modalitesFormation",
  CONTENU_FORMATION: "contenuFormation",
} as const satisfies Record<string, FormationFieldName>;

/** Libellés des champs saisis, partagés par le formulaire et l'annonce de leurs erreurs. */
export const FORMATION_FIELD_LABEL: Record<
  Exclude<FormationFieldName, "certificationViseeEntryMode">,
  string
> = {
  intituleFormation: "Intitulé de la formation",
  certificationVisee: "Diplôme, titre ou certificat délivré",
  intituleCertificationVisee: "Intitulé du diplôme, titre ou certificat",
  numeroFiche: "Code RNCP",
  niveauCertification: "Niveau de la certification que vous visez",
  dureeFormation: "Durée totale",
  heuresParSemaine: "Heures par semaine",
  dateDebutFormation: "Date de début",
  dateFinFormation: "Date de fin",
  modalitesFormation: "Comment se déroule la formation ?",
  contenuFormation: "Contenu de la formation",
};

/** Les sections du volet qui portent un compteur ; les suivantes viendront avec leur ticket. */
export const FORMATION_SECTION = {
  FORMATION: "formation",
} as const;

/** Une section du volet, parmi celles de `FORMATION_SECTION`. */
export type FormationSection = (typeof FORMATION_SECTION)[keyof typeof FORMATION_SECTION];

/** Les champs de chaque mode de saisie du diplôme ; le niveau, choisi dans une liste, n'a rien à contrôler. */
export const CERTIFICATION_VISEE_FIELDS: Record<EntryMode, readonly FormationFieldName[]> = {
  [ENTRY_MODE.SEARCH]: ["certificationVisee"],
  [ENTRY_MODE.MANUAL]: ["intituleCertificationVisee", "numeroFiche"],
};
