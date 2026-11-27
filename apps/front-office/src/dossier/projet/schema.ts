import { z } from "zod";

import {
  currentDemarcheSchema,
  DEMARCHE_REQUIRED_MESSAGES,
  demarcheSchema,
} from "../demarche-schema";
import { DEMARCHE_FIELD_LABEL, findOpenDemarcheFields } from "../domain/demarche";
import { OUI_NON } from "../domain/oui-non";
import { requireFilled } from "../domain/require-filled";
import { LONGUEUR_MAX_TEXTE, LONGUEUR_MAX_TEXTE_MESSAGE } from "../domain/longueur-max-texte";
import { TYPE_DEMARCHE } from "./domain/type-demarche";

const baseProjetSchema = z.object({
  motivationChangement: z
    .string()
    .trim()
    .min(1, "Veuillez indiquer pourquoi vous souhaitez changer de métier.")
    .max(LONGUEUR_MAX_TEXTE, LONGUEUR_MAX_TEXTE_MESSAGE),
  effetsChangement: z
    .string()
    .trim()
    .min(1, "Veuillez indiquer ce que ce changement va modifier dans votre situation.")
    .max(LONGUEUR_MAX_TEXTE, LONGUEUR_MAX_TEXTE_MESSAGE),
  competencesAcquises: z
    .string()
    .trim()
    .min(
      1,
      "Veuillez indiquer les compétences de votre parcours qui vous serviront dans votre futur métier.",
    )
    .max(LONGUEUR_MAX_TEXTE, LONGUEUR_MAX_TEXTE_MESSAGE),
  competencesAAcquerir: z
    .string()
    .trim()
    .min(1, "Veuillez indiquer les compétences qu’il vous reste à acquérir.")
    .max(LONGUEUR_MAX_TEXTE, LONGUEUR_MAX_TEXTE_MESSAGE),
  demarcheConstruction: z.enum(
    OUI_NON,
    "Veuillez indiquer si vous avez réalisé une démarche pour construire votre projet.",
  ),
  // La démarche en cours de saisie : ses champs ne sont exigés qu'après un « oui ».
  typeDemarche: z.enum(TYPE_DEMARCHE).optional(),
  ...currentDemarcheSchema.shape,
  // Les démarches validées, contrôlées à leur validation (`createDemarche`).
  demarches: z.array(demarcheSchema.extend({ typeDemarche: z.enum(TYPE_DEMARCHE) })),
});

/**
 * Les champs que lit le contrôle de la démarche en cours : il ne s'exécute que s'ils ont le bon
 * type. L'apport n'y garde que son type : trop long, il couperait sinon le contrôle du type.
 */
const refinedFieldsSchema = baseProjetSchema
  .pick({ typeDemarche: true, precisionTypeDemarche: true, hasCurrentDemarche: true })
  .extend({ apportDemarche: z.string() });

/**
 * Le schéma du formulaire « Mon projet » ; les champs de la démarche en cours de saisie ne sont
 * exigés qu'après un « oui ».
 */
export const projetSchema = baseProjetSchema.superRefine(
  (data, ctx) => {
    requireFilled(
      ctx,
      data,
      findOpenDemarcheFields(data.demarcheConstruction, data),
      DEMARCHE_REQUIRED_MESSAGES,
    );
  },
  {
    // Sans `when`, zod saute ce contrôle dès qu'un champ est rejeté d'emblée : la démarche
    // n'apparaîtrait qu'au second envoi.
    when: ({ value }) => refinedFieldsSchema.safeParse(value).success,
  },
);

/** Les valeurs du formulaire « Mon projet », telles que le schéma les valide. */
export type ProjetFormData = z.infer<typeof projetSchema>;

/** Nom d'un champ du formulaire, tel que react-hook-form le connaît. */
export type ProjetFieldName = keyof ProjetFormData;

/** Les noms des champs du volet, pour `setValue`, `useWatch` et les `name` des champs. */
export const PROJET_FIELD = {
  MOTIVATION_CHANGEMENT: "motivationChangement",
  EFFETS_CHANGEMENT: "effetsChangement",
  COMPETENCES_ACQUISES: "competencesAcquises",
  COMPETENCES_A_ACQUERIR: "competencesAAcquerir",
  DEMARCHE_CONSTRUCTION: "demarcheConstruction",
  TYPE_DEMARCHE: "typeDemarche",
  PRECISION_TYPE_DEMARCHE: "precisionTypeDemarche",
  APPORT_DEMARCHE: "apportDemarche",
  PIECES_JUSTIFICATIVES: "piecesJustificatives",
  HAS_CURRENT_DEMARCHE: "hasCurrentDemarche",
  CURRENT_DEMARCHE_ID: "currentDemarcheId",
  DEMARCHES: "demarches",
} as const satisfies Record<string, ProjetFieldName>;

/** Libellés des champs saisis, partagés par le formulaire et l'annonce de leurs erreurs. */
export const PROJET_FIELD_LABEL: Record<
  Exclude<ProjetFieldName, "hasCurrentDemarche" | "currentDemarcheId" | "demarches">,
  string
> = {
  motivationChangement: "Pourquoi souhaitez-vous changer de métier ?",
  effetsChangement: "Qu’est-ce que ce changement va modifier dans votre situation ?",
  competencesAcquises:
    "Quelles compétences de votre parcours vous serviront dans votre futur métier ?",
  competencesAAcquerir: "Quelles compétences vous reste-t-il à acquérir ?",
  demarcheConstruction:
    "Avez-vous réalisé un bilan de compétences, un bilan de carrière, une VAE ou une autre prestation pour construire votre projet ?",
  ...DEMARCHE_FIELD_LABEL,
};

/** Les sections du volet qui portent un compteur. */
export const PROJET_SECTION = {
  PROJET: "projet",
  COMPETENCES: "competences",
  DEMARCHES: "demarches",
} as const;

/** Une section du volet, parmi celles de `PROJET_SECTION`. */
export type ProjetSection = (typeof PROJET_SECTION)[keyof typeof PROJET_SECTION];
