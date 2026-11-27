import type { EntryMode } from "../../domain/entry-mode";
import {
  CERTIFICATION_VISEE_FIELDS,
  FORMATION_SECTION,
  REQUIRED_CERTIFICATION_VISEE_FIELDS,
  type FormationFieldName,
  type FormationSection,
} from "../schema";

const INTITULE_FORMATION_FIELD: FormationFieldName = "intituleFormation";

/** Exigés après le diplôme, dans l'ordre de la page ; le calendrier et le programme sont des documents. */
const FORMATION_FIELDS: readonly FormationFieldName[] = [
  "dureeFormation",
  "heuresParSemaine",
  "dateDebutFormation",
  "dateFinFormation",
  "modalitesFormation",
  "contenuFormation",
];

/** Ce qui décide des champs des sections : le mode de saisie du diplôme. */
export interface SectionFieldsAnswers {
  certificationViseeEntryMode: EntryMode;
}

/** L'intitulé, un champ pour le diplôme, en recherche comme en saisie manuelle, puis le reste de la section (maquettes 01, 07 et 09 : 8 champs). */
export function findSectionFields({
  certificationViseeEntryMode,
}: SectionFieldsAnswers): Record<FormationSection, readonly FormationFieldName[]> {
  return {
    [FORMATION_SECTION.FORMATION]: [
      INTITULE_FORMATION_FIELD,
      ...REQUIRED_CERTIFICATION_VISEE_FIELDS[certificationViseeEntryMode],
      ...FORMATION_FIELDS,
    ],
  };
}

/** Le code RNCP, facultatif, est contrôlé : faux, il compte parmi les erreurs du volet. */
export function findSectionValidatedFields({
  certificationViseeEntryMode,
}: SectionFieldsAnswers): Record<FormationSection, readonly FormationFieldName[]> {
  return {
    [FORMATION_SECTION.FORMATION]: [
      INTITULE_FORMATION_FIELD,
      ...CERTIFICATION_VISEE_FIELDS[certificationViseeEntryMode],
      ...FORMATION_FIELDS,
    ],
  };
}
