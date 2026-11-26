import type { EntryMode } from "../../domain/entry-mode";
import { OUI_NON, type OuiNon } from "../../domain/oui-non";
import {
  FUTUR_METIER_SECTION,
  METIER_VISE_FIELDS,
  REQUIRED_METIER_VISE_FIELDS,
  type FuturMetierFieldName,
  type FuturMetierSection,
} from "../schema";
import { findDemarcheFields, type TypeDemarche } from "./demarche";

/** Exigés quel que soit le mode de saisie du métier visé, dans l'ordre de la page ; la spécialisation est facultative. */
const ALWAYS_REQUIRED_FIELDS: readonly FuturMetierFieldName[] = [
  "quotidienMetier",
  "conditionsEmploi",
  "debouches",
  "demarcheDecouverte",
];

/** Ce qui décide des champs de la section : le mode de saisie du métier, et où en sont les démarches. */
export interface SectionFieldsAnswers {
  metierViseEntryMode: EntryMode;
  /** Absente tant que la question n'a pas de réponse. */
  demarcheDecouverte?: OuiNon;
  typeDemarche?: TypeDemarche;
  /** Vrai tant que la carte de saisie d'une démarche est ouverte. */
  hasCurrentDemarche: boolean;
}

/**
 * Les champs de la démarche en cours de saisie ne sont demandés qu'après un « oui », et tant que
 * sa carte est ouverte : une démarche validée ne compte plus (maquettes 09, 10 et 12).
 */
function findOpenDemarcheFields({
  demarcheDecouverte,
  typeDemarche,
  hasCurrentDemarche,
}: SectionFieldsAnswers): readonly FuturMetierFieldName[] {
  return demarcheDecouverte === OUI_NON.OUI && hasCurrentDemarche
    ? findDemarcheFields(typeDemarche)
    : [];
}

/**
 * Un champ pour le métier visé, en recherche comme en saisie manuelle, puis les trois zones de
 * texte, la question sur les démarches et, après un « oui », la démarche en cours de saisie
 * (maquettes 01, 07, 09 et 10).
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
  };
}
