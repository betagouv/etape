import { OUI_NON, type OuiNon } from "../../domain/oui-non";
import {
  FUTUR_METIER_SECTION,
  METIER_VISE_FIELDS,
  REQUIRED_METIER_VISE_FIELDS,
  type FuturMetierFieldName,
  type FuturMetierSection,
  type MetierViseEntryMode,
} from "../schema";
import { findDemarcheFields, type TypeDemarche } from "./demarche";

/** Exigés quel que soit le mode de saisie du métier visé, dans l'ordre de la page ; la spécialisation est facultative. */
const ALWAYS_REQUIRED_FIELDS: readonly FuturMetierFieldName[] = [
  "quotidienMetier",
  "conditionsEmploi",
  "debouches",
  "demarcheDecouverte",
];

/** Les champs de la démarche en cours de saisie ne sont demandés qu'après un « oui » (maquettes 09 et 10). */
function findOpenDemarcheFields(
  demarcheDecouverte: OuiNon | undefined,
  typeDemarche: TypeDemarche | undefined,
): readonly FuturMetierFieldName[] {
  return demarcheDecouverte === OUI_NON.OUI ? findDemarcheFields(typeDemarche) : [];
}

/**
 * Un champ pour le métier visé, en recherche comme en saisie manuelle, puis les trois zones de
 * texte, la question sur les démarches et, après un « oui », la démarche en cours de saisie
 * (maquettes 01, 07, 09 et 10).
 */
export function findSectionFields(
  mode: MetierViseEntryMode,
  demarcheDecouverte: OuiNon | undefined,
  typeDemarche: TypeDemarche | undefined,
): Record<FuturMetierSection, readonly FuturMetierFieldName[]> {
  return {
    [FUTUR_METIER_SECTION.METIER_VISE]: [
      ...REQUIRED_METIER_VISE_FIELDS[mode],
      ...ALWAYS_REQUIRED_FIELDS,
      ...findOpenDemarcheFields(demarcheDecouverte, typeDemarche),
    ],
  };
}

/** Le code ROME, facultatif, est contrôlé : faux, il compte parmi les erreurs du volet. */
export function findSectionValidatedFields(
  mode: MetierViseEntryMode,
  demarcheDecouverte: OuiNon | undefined,
  typeDemarche: TypeDemarche | undefined,
): Record<FuturMetierSection, readonly FuturMetierFieldName[]> {
  return {
    [FUTUR_METIER_SECTION.METIER_VISE]: [
      ...METIER_VISE_FIELDS[mode],
      ...ALWAYS_REQUIRED_FIELDS,
      ...findOpenDemarcheFields(demarcheDecouverte, typeDemarche),
    ],
  };
}
