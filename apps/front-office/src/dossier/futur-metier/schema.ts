import { AppellationRomeSchema } from "@etape/api-contract";
import { z } from "zod";

import {
  currentDemarcheSchema,
  currentDemarcheStateSchema,
  DEMARCHE_REQUIRED_MESSAGES,
  demarcheSchema,
} from "../demarche-schema";
import {
  CURRENT_DEMARCHE_FIELD,
  CURRENT_DEMARCHE_FIELD_LABEL,
  CURRENT_DEMARCHE_PATH,
  findOpenDemarcheFields,
  type CurrentDemarchePath,
} from "../domain/demarche";
import { ENTRY_MODE, type EntryMode } from "../domain/entry-mode";
import { findFieldsAfterOui, OUI_NON } from "../domain/oui-non";
import { requireFilled } from "../domain/require-filled";
import { LONGUEUR_MAX_TEXTE, LONGUEUR_MAX_TEXTE_MESSAGE } from "../domain/longueur-max-texte";
import { formatCodeRome } from "./domain/format-code-rome";
import { TYPE_DEMARCHE } from "./domain/type-demarche";

const CODE_ROME_PATTERN = /^[A-Z]\d{4}$/;

const REQUIRED_MESSAGES = {
  metierVise: "Veuillez choisir le métier que vous visez.",
  intituleMetierVise: "Veuillez saisir le nom du métier que vous visez.",
  ...DEMARCHE_REQUIRED_MESSAGES,
  entreprisesContactees: "Veuillez indiquer les entreprises contactées ou rencontrées.",
} as const;

type RequiredFieldName = keyof typeof REQUIRED_MESSAGES;

/** Les champs exigés par chaque mode : le code ROME de la saisie manuelle est facultatif (maquette 07). */
export const REQUIRED_METIER_VISE_FIELDS: Record<EntryMode, readonly RequiredFieldName[]> = {
  [ENTRY_MODE.SEARCH]: ["metierVise"],
  [ENTRY_MODE.MANUAL]: ["intituleMetierVise"],
};

/** Exigé après un « oui » à la question sur les contacts avec des employeurs (maquette 16). */
export const REQUIRED_CONTACT_EMPLOYEURS_FIELDS: readonly RequiredFieldName[] = [
  "entreprisesContactees",
];

const baseFuturMetierSchema = z.object({
  metierViseEntryMode: z.enum(ENTRY_MODE),
  metierVise: AppellationRomeSchema.nullable(),
  intituleMetierVise: z.string().trim(),
  // Le champ n'est mis en forme qu'à sa sortie : un envoi par Entrée arrive avec la saisie brute.
  codeRome: z.string().transform(formatCodeRome),
  specialisation: z.string().trim(),
  quotidienMetier: z
    .string()
    .trim()
    .min(1, "Veuillez décrire le quotidien de ce métier.")
    .max(LONGUEUR_MAX_TEXTE, LONGUEUR_MAX_TEXTE_MESSAGE),
  conditionsEmploi: z
    .string()
    .trim()
    .min(1, "Veuillez indiquer les conditions habituelles d’emploi dans le métier visé.")
    .max(LONGUEUR_MAX_TEXTE, LONGUEUR_MAX_TEXTE_MESSAGE),
  debouches: z
    .string()
    .trim()
    .min(1, "Veuillez indiquer ce que vous savez des débouchés dans ce métier.")
    .max(LONGUEUR_MAX_TEXTE, LONGUEUR_MAX_TEXTE_MESSAGE),
  demarcheDecouverte: z.enum(
    OUI_NON,
    "Veuillez indiquer si vous avez entrepris des démarches pour découvrir ce métier.",
  ),
  // La démarche en cours de saisie : ses champs ne sont exigés qu'après un « oui ».
  currentDemarche: z.object({
    typeDemarche: z.enum(TYPE_DEMARCHE).optional(),
    ...currentDemarcheSchema.shape,
  }),
  ...currentDemarcheStateSchema.shape,
  // Les démarches validées, contrôlées à leur validation (`createDemarche`).
  demarches: z.array(demarcheSchema.extend({ typeDemarche: z.enum(TYPE_DEMARCHE) })),
  zoneRechercheEmploi: z
    .string()
    .trim()
    .min(1, "Veuillez indiquer la zone où vous chercherez un emploi."),
  demenagement: z.enum(OUI_NON, "Veuillez indiquer si vous envisagez de déménager."),
  contactEmployeurs: z.enum(
    OUI_NON,
    "Veuillez indiquer si vous avez déjà des contacts avec des employeurs.",
  ),
  // Exigées seulement après un « oui » aux contacts avec des employeurs.
  entreprisesContactees: z.string().trim().max(LONGUEUR_MAX_TEXTE, LONGUEUR_MAX_TEXTE_MESSAGE),
});

/**
 * Les champs que lit le contrôle par mode : il ne s'exécute que s'ils ont le bon type.
 * L'apport et les entreprises contactées n'y gardent que leur type : trop longs, ils couperaient
 * sinon le contrôle des autres champs.
 */
const refinedFieldsSchema = baseFuturMetierSchema
  .pick({
    metierViseEntryMode: true,
    metierVise: true,
    intituleMetierVise: true,
    codeRome: true,
    hasCurrentDemarche: true,
  })
  .extend({
    currentDemarche: baseFuturMetierSchema.shape.currentDemarche
      .pick({ typeDemarche: true, precisionTypeDemarche: true })
      .extend({ apportDemarche: z.string() }),
    entreprisesContactees: z.string(),
  });

/**
 * Le schéma du formulaire « Mon futur métier » ; seuls les champs du mode en cours, ceux de
 * la démarche en cours de saisie après un « oui », et les entreprises contactées après un « oui »
 * aux contacts avec des employeurs, sont exigés.
 */
export const futurMetierSchema = baseFuturMetierSchema.superRefine(
  (data, ctx) => {
    requireFilled(
      ctx,
      data,
      findOpenDemarcheFields(data.demarcheDecouverte, data),
      REQUIRED_MESSAGES,
    );

    requireFilled(
      ctx,
      data,
      findFieldsAfterOui(data.contactEmployeurs, REQUIRED_CONTACT_EMPLOYEURS_FIELDS),
      REQUIRED_MESSAGES,
    );

    requireFilled(
      ctx,
      data,
      REQUIRED_METIER_VISE_FIELDS[data.metierViseEntryMode],
      REQUIRED_MESSAGES,
    );
    if (data.metierViseEntryMode === ENTRY_MODE.SEARCH) return;

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

/** Nom d'un champ du formulaire, tel que react-hook-form le connaît : un champ de la démarche en cours se nomme par son chemin. */
export type FuturMetierFieldName = keyof FuturMetierFormData | CurrentDemarchePath;

/** Les noms des champs du volet, pour `setValue`, `useWatch` et les `name` des champs. */
export const FUTUR_METIER_FIELD = {
  METIER_VISE_ENTRY_MODE: "metierViseEntryMode",
  METIER_VISE: "metierVise",
  INTITULE_METIER_VISE: "intituleMetierVise",
  CODE_ROME: "codeRome",
  SPECIALISATION: "specialisation",
  QUOTIDIEN_METIER: "quotidienMetier",
  CONDITIONS_EMPLOI: "conditionsEmploi",
  DEBOUCHES: "debouches",
  DEMARCHE_DECOUVERTE: "demarcheDecouverte",
  CURRENT_DEMARCHE: CURRENT_DEMARCHE_FIELD,
  TYPE_DEMARCHE: CURRENT_DEMARCHE_PATH.typeDemarche,
  PRECISION_TYPE_DEMARCHE: CURRENT_DEMARCHE_PATH.precisionTypeDemarche,
  APPORT_DEMARCHE: CURRENT_DEMARCHE_PATH.apportDemarche,
  PIECES_JUSTIFICATIVES: CURRENT_DEMARCHE_PATH.piecesJustificatives,
  HAS_CURRENT_DEMARCHE: "hasCurrentDemarche",
  CURRENT_DEMARCHE_ID: "currentDemarcheId",
  DEMARCHES: "demarches",
  ZONE_RECHERCHE_EMPLOI: "zoneRechercheEmploi",
  DEMENAGEMENT: "demenagement",
  CONTACT_EMPLOYEURS: "contactEmployeurs",
  ENTREPRISES_CONTACTEES: "entreprisesContactees",
} as const satisfies Record<string, FuturMetierFieldName>;

/** Libellés des champs saisis, partagés par le formulaire et l'annonce de leurs erreurs. */
export const FUTUR_METIER_FIELD_LABEL: Record<
  Exclude<
    FuturMetierFieldName,
    | "metierViseEntryMode"
    | "currentDemarche"
    | "hasCurrentDemarche"
    | "currentDemarcheId"
    | "demarches"
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
  ...CURRENT_DEMARCHE_FIELD_LABEL,
  zoneRechercheEmploi: "Dans quelle zone géographique chercherez-vous un emploi ?",
  demenagement: "Envisagez-vous de déménager pour trouver un emploi ?",
  contactEmployeurs: "Avez-vous déjà des contacts avec des employeurs ?",
  entreprisesContactees:
    "Veuillez indiquer ci-dessous les entreprises contactées ou rencontrées au cours de vos recherches",
};

/** Les sections du volet qui portent un compteur. */
export const FUTUR_METIER_SECTION = {
  METIER_VISE: "metier-vise",
  PERSPECTIVES_EMPLOI: "perspectives-emploi",
} as const;

/** Une section du volet, parmi celles de `FUTUR_METIER_SECTION`. */
export type FuturMetierSection = (typeof FUTUR_METIER_SECTION)[keyof typeof FUTUR_METIER_SECTION];

/** Les champs de chaque mode de saisie du métier visé. */
export const METIER_VISE_FIELDS: Record<EntryMode, readonly FuturMetierFieldName[]> = {
  [ENTRY_MODE.SEARCH]: ["metierVise"],
  [ENTRY_MODE.MANUAL]: ["intituleMetierVise", "codeRome"],
};
