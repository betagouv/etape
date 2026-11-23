import type { EntryMode } from "../../domain/entry-mode";
import { OUI_NON, type OuiNon } from "../../domain/oui-non";
import {
  EMPLOYEUR_FIELDS,
  SITUATION_PROFESSIONNELLE_SECTION,
  type SituationProfessionnelleFieldName,
  type SituationProfessionnelleSection,
} from "../schema";

/** La date n'est exigée qu'après un « oui » (maquette 10). */
export function findSectionFields(
  mode: EntryMode,
  demission: OuiNon | undefined,
): Record<SituationProfessionnelleSection, readonly SituationProfessionnelleFieldName[]> {
  return {
    // 2 champs en recherche, 5 en saisie manuelle (maquettes 01 et 07).
    [SITUATION_PROFESSIONNELLE_SECTION.EMPLOI]: [...EMPLOYEUR_FIELDS[mode], "intitulePoste"],
    [SITUATION_PROFESSIONNELLE_SECTION.DEMISSION]:
      demission === OUI_NON.OUI ? ["demission", "dateDemission"] : ["demission"],
  };
}
