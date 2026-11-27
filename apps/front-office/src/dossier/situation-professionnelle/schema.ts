import { EtablissementSchema } from "@etape/api-contract";
import { z } from "zod";

import { ENTRY_MODE, type EntryMode } from "../domain/entry-mode";
import { isOui, OUI_NON } from "../domain/oui-non";
import { requireFilled } from "../domain/require-filled";
import { isDateDemissionInFuture } from "./domain/date-demission";

const SIRET_PATTERN = /^\d{14}$/;

const REQUIRED_MESSAGES = {
  employeur: "Veuillez choisir votre employeur.",
  denomination: "Veuillez saisir le nom de votre employeur.",
  secteurActivite: "Veuillez choisir le secteur d’activité.",
  adresse: "Veuillez saisir l’adresse de votre employeur.",
  dateDemission: "Veuillez choisir la date de votre démission.",
} as const;

type RequiredFieldName = keyof typeof REQUIRED_MESSAGES;

/** Les champs de chaque mode qu'il suffit de remplir ; le SIRET, lui, est contrôlé par son format. */
const REQUIRED_EMPLOYEUR_FIELDS: Record<EntryMode, readonly RequiredFieldName[]> = {
  [ENTRY_MODE.SEARCH]: ["employeur"],
  [ENTRY_MODE.MANUAL]: ["denomination", "secteurActivite", "adresse"],
};

/** Exigé après un « oui » à la question sur la démission (maquette 10). */
export const REQUIRED_DEMISSION_FIELDS: readonly RequiredFieldName[] = ["dateDemission"];

const baseSituationProfessionnelleSchema = z.object({
  employeurEntryMode: z.enum(ENTRY_MODE),
  employeur: EtablissementSchema.nullable(),
  denomination: z.string().trim(),
  siret: z.string(),
  secteurActivite: z.string(),
  adresse: z.string().trim(),
  intitulePoste: z.string().trim().min(1, "Veuillez saisir l’intitulé de votre poste."),
  demission: z.enum(OUI_NON, "Veuillez indiquer si vous avez remis votre démission."),
  dateDemission: z.string(),
});

/** Les champs que lit le contrôle par mode : il ne s'exécute que s'ils ont le bon type. */
const refinedFieldsSchema = baseSituationProfessionnelleSchema.pick({
  employeurEntryMode: true,
  employeur: true,
  denomination: true,
  siret: true,
  secteurActivite: true,
  adresse: true,
  dateDemission: true,
});

/** Le schéma du formulaire « Ma situation professionnelle » ; seuls les champs du mode en cours sont exigés. */
export const situationProfessionnelleSchema = baseSituationProfessionnelleSchema.superRefine(
  (data, ctx) => {
    if (isOui(data.demission)) {
      requireFilled(ctx, data, REQUIRED_DEMISSION_FIELDS, REQUIRED_MESSAGES);
      if (isDateDemissionInFuture(data.dateDemission, new Date())) {
        ctx.addIssue({
          code: "custom",
          path: ["dateDemission"],
          message: "La date de votre démission ne peut pas être dans le futur.",
        });
      }
    }

    requireFilled(ctx, data, REQUIRED_EMPLOYEUR_FIELDS[data.employeurEntryMode], REQUIRED_MESSAGES);
    if (data.employeurEntryMode === ENTRY_MODE.SEARCH) return;

    if (!SIRET_PATTERN.test(data.siret.replace(/\s/g, ""))) {
      ctx.addIssue({
        code: "custom",
        path: ["siret"],
        message: "Le numéro SIRET doit comporter 14 chiffres.",
      });
    }
  },
  {
    // Sans `when`, zod saute ce contrôle dès qu'un champ est rejeté d'emblée : l'employeur
    // n'apparaîtrait qu'au second envoi.
    when: ({ value }) => refinedFieldsSchema.safeParse(value).success,
  },
);

/** Les valeurs du formulaire « Ma situation professionnelle », telles que le schéma les valide. */
export type SituationProfessionnelleFormData = z.infer<typeof situationProfessionnelleSchema>;

/** Nom d'un champ du formulaire, tel que react-hook-form le connaît. */
export type SituationProfessionnelleFieldName = keyof SituationProfessionnelleFormData;

/** Les noms des champs du volet, pour `setValue`, `useWatch` et les `name` des champs. */
export const SITUATION_PROFESSIONNELLE_FIELD = {
  EMPLOYEUR_ENTRY_MODE: "employeurEntryMode",
  EMPLOYEUR: "employeur",
  DENOMINATION: "denomination",
  SIRET: "siret",
  SECTEUR_ACTIVITE: "secteurActivite",
  ADRESSE: "adresse",
  INTITULE_POSTE: "intitulePoste",
  DEMISSION: "demission",
  DATE_DEMISSION: "dateDemission",
} as const satisfies Record<string, SituationProfessionnelleFieldName>;

/** Libellés des champs saisis, partagés par le formulaire et l'annonce de leurs erreurs. */
export const SITUATION_PROFESSIONNELLE_FIELD_LABEL: Record<
  Exclude<SituationProfessionnelleFieldName, "employeurEntryMode">,
  string
> = {
  employeur: "Votre employeur",
  denomination: "Nom de votre employeur",
  siret: "Numéro SIRET",
  secteurActivite: "Secteur d’activité",
  adresse: "Adresse",
  intitulePoste: "Intitulé de votre poste",
  demission: "Avez-vous déjà remis votre démission à votre employeur ?",
  dateDemission: "Date de votre démission",
};

/** Les sections du volet qui portent un compteur. */
export const SITUATION_PROFESSIONNELLE_SECTION = {
  EMPLOI: "emploi",
  DEMISSION: "demission",
} as const;

/** Une section du volet, parmi celles de `SITUATION_PROFESSIONNELLE_SECTION`. */
export type SituationProfessionnelleSection =
  (typeof SITUATION_PROFESSIONNELLE_SECTION)[keyof typeof SITUATION_PROFESSIONNELLE_SECTION];

/** Les champs exigés par chaque mode de saisie de l'employeur. */
export const EMPLOYEUR_FIELDS: Record<EntryMode, readonly SituationProfessionnelleFieldName[]> = {
  [ENTRY_MODE.SEARCH]: ["employeur"],
  [ENTRY_MODE.MANUAL]: ["denomination", "siret", "secteurActivite", "adresse"],
};
