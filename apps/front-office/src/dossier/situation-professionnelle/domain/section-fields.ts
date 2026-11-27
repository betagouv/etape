import type { EntryMode } from "../../domain/entry-mode";
import { findFieldsAfterOui, type OuiNon } from "../../domain/oui-non";
import {
  EMPLOYEUR_FIELDS,
  REQUIRED_DEMISSION_FIELDS,
  SITUATION_PROFESSIONNELLE_SECTION,
  type SituationProfessionnelleFieldName,
  type SituationProfessionnelleSection,
} from "../schema";

/** Ce qui décide des champs des sections : le mode de saisie de l'employeur et la réponse sur la démission. */
export interface SectionFieldsAnswers {
  employeurEntryMode: EntryMode;
  /** Absente tant que la question n'a pas de réponse. */
  demission?: OuiNon;
}

/** La date n'est exigée qu'après un « oui » (maquette 10). */
export function findSectionFields({
  employeurEntryMode,
  demission,
}: SectionFieldsAnswers): Record<
  SituationProfessionnelleSection,
  readonly SituationProfessionnelleFieldName[]
> {
  return {
    // 2 champs en recherche, 5 en saisie manuelle (maquettes 01 et 07).
    [SITUATION_PROFESSIONNELLE_SECTION.EMPLOI]: [
      ...EMPLOYEUR_FIELDS[employeurEntryMode],
      "intitulePoste",
    ],
    [SITUATION_PROFESSIONNELLE_SECTION.DEMISSION]: [
      "demission",
      ...findFieldsAfterOui(demission, REQUIRED_DEMISSION_FIELDS),
    ],
  };
}
