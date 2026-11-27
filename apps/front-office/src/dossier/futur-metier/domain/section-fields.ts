import type { EntryMode } from "../../domain/entry-mode";
import { findFieldsAfterOui, type OuiNon } from "../../domain/oui-non";
import {
  FUTUR_METIER_SECTION,
  METIER_VISE_FIELDS,
  REQUIRED_CONTACT_EMPLOYEURS_FIELDS,
  REQUIRED_METIER_VISE_FIELDS,
  type FuturMetierFieldName,
  type FuturMetierSection,
} from "../schema";
import { findOpenDemarcheFields, type TypeDemarche } from "./demarche";

/** Exigés quel que soit le mode de saisie du métier visé, dans l'ordre de la page ; la spécialisation est facultative. */
const ALWAYS_REQUIRED_FIELDS: readonly FuturMetierFieldName[] = [
  "quotidienMetier",
  "conditionsEmploi",
  "debouches",
  "demarcheDecouverte",
];

/** Exigés dans « Vos perspectives d'emploi », dans l'ordre de la page (maquette 16). */
const PERSPECTIVES_EMPLOI_FIELDS: readonly FuturMetierFieldName[] = [
  "zoneRechercheEmploi",
  "demenagement",
  "contactEmployeurs",
];

/**
 * Ce qui décide des champs des sections : le mode de saisie du métier, où en sont les démarches,
 * et la réponse sur les contacts avec des employeurs.
 */
export interface SectionFieldsAnswers {
  metierViseEntryMode: EntryMode;
  /** Absente tant que la question n'a pas de réponse. */
  demarcheDecouverte?: OuiNon;
  typeDemarche?: TypeDemarche;
  /** Vrai tant que la carte de saisie d'une démarche est ouverte. */
  hasCurrentDemarche: boolean;
  /** Absente tant que la question n'a pas de réponse. */
  contactEmployeurs?: OuiNon;
}

/** Les entreprises contactées ne sont demandées qu'après un « oui » aux contacts (maquette 16). */
function findPerspectivesEmploiFields({
  contactEmployeurs,
}: SectionFieldsAnswers): readonly FuturMetierFieldName[] {
  return [
    ...PERSPECTIVES_EMPLOI_FIELDS,
    ...findFieldsAfterOui(contactEmployeurs, REQUIRED_CONTACT_EMPLOYEURS_FIELDS),
  ];
}

/**
 * Un champ pour le métier visé, en recherche comme en saisie manuelle, puis les trois zones de
 * texte, la question sur les démarches et, après un « oui », la démarche en cours de saisie
 * (maquettes 01, 07, 09 et 10) ; enfin, les perspectives d'emploi (maquette 16).
 */
export function findSectionFields(
  answers: SectionFieldsAnswers,
): Record<FuturMetierSection, readonly FuturMetierFieldName[]> {
  return {
    [FUTUR_METIER_SECTION.METIER_VISE]: [
      ...REQUIRED_METIER_VISE_FIELDS[answers.metierViseEntryMode],
      ...ALWAYS_REQUIRED_FIELDS,
      ...findOpenDemarcheFields(answers),
    ],
    [FUTUR_METIER_SECTION.PERSPECTIVES_EMPLOI]: findPerspectivesEmploiFields(answers),
  };
}

/** Le code ROME, facultatif, est contrôlé : faux, il compte parmi les erreurs du volet. */
export function findSectionValidatedFields(
  answers: SectionFieldsAnswers,
): Record<FuturMetierSection, readonly FuturMetierFieldName[]> {
  return {
    [FUTUR_METIER_SECTION.METIER_VISE]: [
      ...METIER_VISE_FIELDS[answers.metierViseEntryMode],
      ...ALWAYS_REQUIRED_FIELDS,
      ...findOpenDemarcheFields(answers),
    ],
    [FUTUR_METIER_SECTION.PERSPECTIVES_EMPLOI]: findPerspectivesEmploiFields(answers),
  };
}
