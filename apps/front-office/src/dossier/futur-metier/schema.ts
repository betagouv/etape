import { AppellationRomeSchema } from "@etape/api-contract";
import { z } from "zod";

/** Le métier visé se choisit dans le référentiel ROME, ou se saisit à la main quand la recherche échoue. */
export const METIER_VISE_ENTRY_MODE = {
  SEARCH: "search",
  MANUAL: "manual",
} as const;

/** Un mode de saisie, parmi ceux de `METIER_VISE_ENTRY_MODE`. */
export type MetierViseEntryMode =
  (typeof METIER_VISE_ENTRY_MODE)[keyof typeof METIER_VISE_ENTRY_MODE];

const CODE_ROME_PATTERN = /^[A-Z]\d{4}$/;

const REQUIRED_MESSAGES = {
  metierVise: "Veuillez choisir le métier que vous visez.",
  intituleMetierVise: "Veuillez saisir le nom du métier que vous visez.",
} as const;

const baseFuturMetierSchema = z.object({
  metierViseEntryMode: z.enum(METIER_VISE_ENTRY_MODE),
  metierVise: AppellationRomeSchema.nullable(),
  intituleMetierVise: z.string().trim(),
  codeRome: z.string(),
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
    const require = (path: keyof typeof REQUIRED_MESSAGES, isFilled: boolean): void => {
      if (!isFilled)
        ctx.addIssue({ code: "custom", path: [path], message: REQUIRED_MESSAGES[path] });
    };

    if (data.metierViseEntryMode === METIER_VISE_ENTRY_MODE.SEARCH) {
      require("metierVise", data.metierVise !== null);
      return;
    }

    require("intituleMetierVise", data.intituleMetierVise !== "");
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

/** Les champs exigés par chaque mode : le code ROME de la saisie manuelle est facultatif (maquette 07). */
const REQUIRED_METIER_VISE_FIELDS: Record<MetierViseEntryMode, readonly FuturMetierFieldName[]> = {
  [METIER_VISE_ENTRY_MODE.SEARCH]: ["metierVise"],
  [METIER_VISE_ENTRY_MODE.MANUAL]: ["intituleMetierVise"],
};

/** Un seul champ exigé, en recherche comme en saisie manuelle (maquettes 01 et 07). */
export function findSectionFields(
  mode: MetierViseEntryMode,
): Record<FuturMetierSection, readonly FuturMetierFieldName[]> {
  return {
    [FUTUR_METIER_SECTION.METIER_VISE]: REQUIRED_METIER_VISE_FIELDS[mode],
  };
}
