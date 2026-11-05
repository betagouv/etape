import { EtablissementSchema } from "@etape/api-contract";
import { z } from "zod";

export const DEMISSION = {
  OUI: "oui",
  NON: "non",
} as const;

export type Demission = (typeof DEMISSION)[keyof typeof DEMISSION];

export const DEMISSION_LABEL: Record<Demission, string> = {
  [DEMISSION.OUI]: "Oui",
  [DEMISSION.NON]: "Non",
};

/** L'employeur se choisit dans Sirene, ou se saisit à la main quand la recherche échoue. */
export const EMPLOYEUR_ENTRY_MODE = {
  SEARCH: "search",
  MANUAL: "manual",
} as const;

export type EmployeurEntryMode = (typeof EMPLOYEUR_ENTRY_MODE)[keyof typeof EMPLOYEUR_ENTRY_MODE];

const SIRET_PATTERN = /^\d{14}$/;

const REQUIRED_MESSAGES = {
  employeur: "Veuillez choisir votre employeur.",
  denomination: "Veuillez saisir le nom de votre employeur.",
  secteurActivite: "Veuillez choisir le secteur d’activité.",
  adresse: "Veuillez saisir l’adresse de votre employeur.",
  dateDemission: "Veuillez choisir la date de votre démission.",
} as const;

/** Les champs que lit le contrôle par mode : il ne s'exécute que s'ils ont le bon type. */
const REFINED_FIELDS: ReadonlySet<string> = new Set([
  "employeurEntryMode",
  "employeur",
  "denomination",
  "siret",
  "secteurActivite",
  "adresse",
  "dateDemission",
]);

export const situationProfessionnelleSchema = z
  .object({
    employeurEntryMode: z.enum(EMPLOYEUR_ENTRY_MODE),
    employeur: EtablissementSchema.nullable(),
    denomination: z.string().trim(),
    siret: z.string(),
    secteurActivite: z.string(),
    adresse: z.string().trim(),
    intitulePoste: z.string().trim().min(1, "Veuillez saisir l’intitulé de votre poste."),
    demission: z.enum(DEMISSION, "Veuillez indiquer si vous avez remis votre démission."),
    dateDemission: z.string(),
  })
  // Seuls les champs du mode en cours sont exigés.
  .superRefine(
    (data, ctx) => {
      const require = (path: keyof typeof REQUIRED_MESSAGES, isFilled: boolean): void => {
        if (!isFilled)
          ctx.addIssue({ code: "custom", path: [path], message: REQUIRED_MESSAGES[path] });
      };

      if (data.demission === DEMISSION.OUI) require("dateDemission", data.dateDemission !== "");

      if (data.employeurEntryMode === EMPLOYEUR_ENTRY_MODE.SEARCH) {
        require("employeur", data.employeur !== null);
        return;
      }

      require("denomination", data.denomination !== "");
      if (!SIRET_PATTERN.test(data.siret.replace(/\s/g, ""))) {
        ctx.addIssue({
          code: "custom",
          path: ["siret"],
          message: "Le numéro SIRET doit comporter 14 chiffres.",
        });
      }
      require("secteurActivite", data.secteurActivite !== "");
      require("adresse", data.adresse !== "");
    },
    // Sans cela, zod saute ce contrôle dès qu'un autre champ est en erreur : l'employeur n'apparaîtrait qu'au second envoi.
    { when: ({ issues }) => issues.every(({ path = [] }) => !REFINED_FIELDS.has(String(path[0]))) },
  );

export type SituationProfessionnelleFormData = z.infer<typeof situationProfessionnelleSchema>;

type SituationProfessionnelleFieldName = keyof SituationProfessionnelleFormData;

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
  // La légende pose la question ; l'annonce, lue après coup, n'a besoin que du sujet.
  demission: "Démission",
  dateDemission: "Date de votre démission",
};

export const SITUATION_PROFESSIONNELLE_SECTION = {
  EMPLOI: "emploi",
  DEMISSION: "demission",
} as const;

export type SituationProfessionnelleSection =
  (typeof SITUATION_PROFESSIONNELLE_SECTION)[keyof typeof SITUATION_PROFESSIONNELLE_SECTION];

/** Les champs exigés par chaque mode de saisie de l'employeur. */
export const EMPLOYEUR_FIELDS: Record<
  EmployeurEntryMode,
  readonly SituationProfessionnelleFieldName[]
> = {
  [EMPLOYEUR_ENTRY_MODE.SEARCH]: ["employeur"],
  [EMPLOYEUR_ENTRY_MODE.MANUAL]: ["denomination", "siret", "secteurActivite", "adresse"],
};

/** La date n'est exigée qu'après un « oui » (maquette 10). */
export function findSectionFields(
  mode: EmployeurEntryMode,
  demission: Demission | undefined,
): Record<SituationProfessionnelleSection, readonly SituationProfessionnelleFieldName[]> {
  return {
    // 2 champs en recherche, 5 en saisie manuelle (maquettes 01 et 07).
    [SITUATION_PROFESSIONNELLE_SECTION.EMPLOI]: [...EMPLOYEUR_FIELDS[mode], "intitulePoste"],
    [SITUATION_PROFESSIONNELLE_SECTION.DEMISSION]:
      demission === DEMISSION.OUI ? ["demission", "dateDemission"] : ["demission"],
  };
}
