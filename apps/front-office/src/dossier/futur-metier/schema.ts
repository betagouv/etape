import { AppellationRomeSchema } from "@etape/api-contract";
import { z } from "zod";

import { OUI_NON } from "../domain/oui-non";
import { requireFilled } from "../domain/require-filled";
import { findDemarcheFields, TYPE_DEMARCHE } from "./domain/demarche";
import { formatCodeRome } from "./domain/format-code-rome";

/** Le métier visé se choisit dans le référentiel ROME, ou se saisit à la main quand la recherche échoue. */
export const METIER_VISE_ENTRY_MODE = {
  SEARCH: "search",
  MANUAL: "manual",
} as const;

/** Un mode de saisie, parmi ceux de `METIER_VISE_ENTRY_MODE`. */
export type MetierViseEntryMode =
  (typeof METIER_VISE_ENTRY_MODE)[keyof typeof METIER_VISE_ENTRY_MODE];

const CODE_ROME_PATTERN = /^[A-Z]\d{4}$/;

/** La limite des zones de texte de la section « Le métier » (maquettes 01 et 10 : « 0/1000 caractères »). */
export const FUTUR_METIER_TEXT_MAX_LENGTH = 1000;

// Le navigateur bloque la saisie à la limite ; le schéma la contrôle pour un texte venu d'ailleurs.
const TEXT_MAX_LENGTH_MESSAGE = `Votre texte ne doit pas dépasser ${FUTUR_METIER_TEXT_MAX_LENGTH} caractères.`;

const REQUIRED_MESSAGES = {
  metierVise: "Veuillez choisir le métier que vous visez.",
  intituleMetierVise: "Veuillez saisir le nom du métier que vous visez.",
  typeDemarche: "Veuillez choisir le type de démarche.",
  precisionTypeDemarche: "Veuillez préciser le type de démarche.",
  apportDemarche: "Veuillez indiquer ce que la démarche vous a apporté.",
} as const;

type RequiredFieldName = keyof typeof REQUIRED_MESSAGES;

/** Les champs exigés par chaque mode : le code ROME de la saisie manuelle est facultatif (maquette 07). */
export const REQUIRED_METIER_VISE_FIELDS: Record<
  MetierViseEntryMode,
  readonly RequiredFieldName[]
> = {
  [METIER_VISE_ENTRY_MODE.SEARCH]: ["metierVise"],
  [METIER_VISE_ENTRY_MODE.MANUAL]: ["intituleMetierVise"],
};

const pieceJustificativeSchema = z.object({
  id: z.string(),
  fichier: z.instanceof(File),
  dateDepot: z.date(),
});

const baseFuturMetierSchema = z.object({
  metierViseEntryMode: z.enum(METIER_VISE_ENTRY_MODE),
  metierVise: AppellationRomeSchema.nullable(),
  intituleMetierVise: z.string().trim(),
  // Le champ n'est mis en forme qu'à sa sortie : un envoi par Entrée arrive avec la saisie brute.
  codeRome: z.string().transform(formatCodeRome),
  specialisation: z.string().trim(),
  quotidienMetier: z
    .string()
    .trim()
    .min(1, "Veuillez décrire le quotidien de ce métier.")
    .max(FUTUR_METIER_TEXT_MAX_LENGTH, TEXT_MAX_LENGTH_MESSAGE),
  conditionsEmploi: z
    .string()
    .trim()
    .min(1, "Veuillez indiquer les conditions habituelles d’emploi dans le métier visé.")
    .max(FUTUR_METIER_TEXT_MAX_LENGTH, TEXT_MAX_LENGTH_MESSAGE),
  debouches: z
    .string()
    .trim()
    .min(1, "Veuillez indiquer ce que vous savez des débouchés dans ce métier.")
    .max(FUTUR_METIER_TEXT_MAX_LENGTH, TEXT_MAX_LENGTH_MESSAGE),
  demarcheDecouverte: z.enum(
    OUI_NON,
    "Veuillez indiquer si vous avez entrepris des démarches pour découvrir ce métier.",
  ),
  // La démarche en cours de saisie : ses champs ne sont exigés qu'après un « oui ».
  typeDemarche: z.enum(TYPE_DEMARCHE).optional(),
  precisionTypeDemarche: z.string().trim(),
  apportDemarche: z.string().trim().max(FUTUR_METIER_TEXT_MAX_LENGTH, TEXT_MAX_LENGTH_MESSAGE),
  // Facultatives ; format et taille sont contrôlés à l'ajout (`checkFichiers`).
  piecesJustificatives: z.array(pieceJustificativeSchema),
  // Vrai tant que la carte de saisie est ouverte : elle se referme sur chaque démarche validée.
  hasCurrentDemarche: z.boolean(),
  // La démarche validée que la saisie modifie ; `null` pour une nouvelle démarche.
  currentDemarcheId: z.string().nullable(),
  // Les démarches validées, contrôlées à leur validation (`createDemarche`).
  demarches: z.array(
    z.object({
      id: z.string(),
      typeDemarche: z.enum(TYPE_DEMARCHE),
      precisionTypeDemarche: z.string(),
      apportDemarche: z.string(),
      piecesJustificatives: z.array(pieceJustificativeSchema),
    }),
  ),
});

/**
 * Les champs que lit le contrôle par mode : il ne s'exécute que s'ils ont le bon type.
 * L'apport n'y garde que son type : trop long, il couperait sinon le contrôle des autres champs.
 */
const refinedFieldsSchema = baseFuturMetierSchema
  .pick({
    metierViseEntryMode: true,
    metierVise: true,
    intituleMetierVise: true,
    codeRome: true,
    typeDemarche: true,
    precisionTypeDemarche: true,
    hasCurrentDemarche: true,
  })
  .extend({ apportDemarche: z.string() });

/**
 * Le schéma du formulaire « Mon futur métier » ; seuls les champs du mode en cours, et ceux de
 * la démarche en cours de saisie après un « oui », sont exigés.
 */
export const futurMetierSchema = baseFuturMetierSchema.superRefine(
  (data, ctx) => {
    if (data.demarcheDecouverte === OUI_NON.OUI && data.hasCurrentDemarche)
      requireFilled(ctx, data, findDemarcheFields(data.typeDemarche), REQUIRED_MESSAGES);

    requireFilled(
      ctx,
      data,
      REQUIRED_METIER_VISE_FIELDS[data.metierViseEntryMode],
      REQUIRED_MESSAGES,
    );
    if (data.metierViseEntryMode === METIER_VISE_ENTRY_MODE.SEARCH) return;

    // Facultatif : contrôlé seulement s'il est rempli.
    if (data.codeRome !== "" && !CODE_ROME_PATTERN.test(data.codeRome)) {
      ctx.addIssue({
        code: "custom",
        path: ["codeRome"],
        message: "Le code ROME comporte une lettre suivie de quatre chiffres, par exemple D1102.",
      });
    }
  },
  {
    // Sans `when`, zod saute ce contrôle dès qu'un champ est rejeté d'emblée : le métier
    // n'apparaîtrait qu'au second envoi.
    when: ({ value }) => refinedFieldsSchema.safeParse(value).success,
  },
);

/** Les valeurs du formulaire « Mon futur métier », telles que le schéma les valide. */
export type FuturMetierFormData = z.infer<typeof futurMetierSchema>;

/** Nom d'un champ du formulaire, tel que react-hook-form le connaît. */
export type FuturMetierFieldName = keyof FuturMetierFormData;

/** Libellés des champs saisis, partagés par le formulaire et l'annonce de leurs erreurs. */
export const FUTUR_METIER_FIELD_LABEL: Record<
  Exclude<
    FuturMetierFieldName,
    "metierViseEntryMode" | "hasCurrentDemarche" | "currentDemarcheId" | "demarches"
  >,
  string
> = {
  metierVise: "Quel métier visez-vous ?",
  intituleMetierVise: "Nom du métier que vous visez",
  codeRome: "Code ROME",
  specialisation: "Spécialisation",
  quotidienMetier: "À quoi ressemble le quotidien de ce métier ?",
  conditionsEmploi: "Quelles sont les conditions habituelles d’emploi dans le métier visé ?",
  debouches: "Que savez-vous des débouchés dans ce métier ?",
  demarcheDecouverte: "Avez-vous entrepris des démarches pour découvrir ce métier ?",
  typeDemarche: "Type de démarche",
  precisionTypeDemarche: "Précisez le type de démarche",
  apportDemarche: "Ce que la démarche vous a apporté",
  piecesJustificatives: "Justificatifs",
};

/** Les sections du volet qui portent un compteur. */
export const FUTUR_METIER_SECTION = {
  METIER_VISE: "metier-vise",
} as const;

/** Une section du volet, parmi celles de `FUTUR_METIER_SECTION`. */
export type FuturMetierSection = (typeof FUTUR_METIER_SECTION)[keyof typeof FUTUR_METIER_SECTION];

/** Les champs de chaque mode de saisie du métier visé. */
export const METIER_VISE_FIELDS: Record<MetierViseEntryMode, readonly FuturMetierFieldName[]> = {
  [METIER_VISE_ENTRY_MODE.SEARCH]: ["metierVise"],
  [METIER_VISE_ENTRY_MODE.MANUAL]: ["intituleMetierVise", "codeRome"],
};
