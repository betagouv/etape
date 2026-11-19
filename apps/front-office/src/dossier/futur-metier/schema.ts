import { AppellationRomeSchema } from "@etape/api-contract";
import { z } from "zod";

import { OUI_NON } from "../domain/oui-non";
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

/** La limite des trois zones de texte de la section « Le métier » (maquette 01 : « 0/1000 caractères »). */
export const FUTUR_METIER_TEXT_MAX_LENGTH = 1000;

// Le navigateur bloque la saisie à la limite ; le schéma la contrôle pour un texte venu d'ailleurs.
const TEXT_MAX_LENGTH_MESSAGE = `Votre texte ne doit pas dépasser ${FUTUR_METIER_TEXT_MAX_LENGTH} caractères.`;

const REQUIRED_MESSAGES = {
  metierVise: "Veuillez choisir le métier que vous visez.",
  intituleMetierVise: "Veuillez saisir le nom du métier que vous visez.",
} as const;

type RequiredFieldName = keyof typeof REQUIRED_MESSAGES;

/** Les champs exigés par chaque mode : le code ROME de la saisie manuelle est facultatif (maquette 07). */
const REQUIRED_METIER_VISE_FIELDS: Record<MetierViseEntryMode, readonly RequiredFieldName[]> = {
  [METIER_VISE_ENTRY_MODE.SEARCH]: ["metierVise"],
  [METIER_VISE_ENTRY_MODE.MANUAL]: ["intituleMetierVise"],
};

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
});

/** Les champs que lit le contrôle par mode : il ne s'exécute que s'ils ont le bon type. */
const refinedFieldsSchema = baseFuturMetierSchema.pick({
  metierViseEntryMode: true,
  metierVise: true,
  intituleMetierVise: true,
  codeRome: true,
});

/** Le schéma du formulaire « Mon futur métier » ; seuls les champs du mode en cours sont exigés. */
export const futurMetierSchema = baseFuturMetierSchema.superRefine(
  (data, ctx) => {
    for (const name of REQUIRED_METIER_VISE_FIELDS[data.metierViseEntryMode]) {
      const value = data[name];
      if (value === null || value === "")
        ctx.addIssue({ code: "custom", path: [name], message: REQUIRED_MESSAGES[name] });
    }

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
  Exclude<FuturMetierFieldName, "metierViseEntryMode">,
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

/** Exigés quel que soit le mode de saisie du métier visé, dans l'ordre de la page ; la spécialisation est facultative. */
const ALWAYS_REQUIRED_FIELDS: readonly FuturMetierFieldName[] = [
  "quotidienMetier",
  "conditionsEmploi",
  "debouches",
  "demarcheDecouverte",
];

/** Un champ pour le métier visé, en recherche comme en saisie manuelle, puis les trois zones de texte et la question sur les démarches (maquettes 01, 07 et 09). */
export function findSectionFields(
  mode: MetierViseEntryMode,
): Record<FuturMetierSection, readonly FuturMetierFieldName[]> {
  return {
    [FUTUR_METIER_SECTION.METIER_VISE]: [
      ...REQUIRED_METIER_VISE_FIELDS[mode],
      ...ALWAYS_REQUIRED_FIELDS,
    ],
  };
}

/** Le code ROME, facultatif, est contrôlé : faux, il compte parmi les erreurs du volet. */
export function findSectionValidatedFields(
  mode: MetierViseEntryMode,
): Record<FuturMetierSection, readonly FuturMetierFieldName[]> {
  return {
    [FUTUR_METIER_SECTION.METIER_VISE]: [...METIER_VISE_FIELDS[mode], ...ALWAYS_REQUIRED_FIELDS],
  };
}
