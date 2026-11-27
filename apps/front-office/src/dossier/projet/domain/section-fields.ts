import { findOpenDemarcheFields, type OpenDemarche } from "../../domain/demarche";
import type { OuiNon } from "../../domain/oui-non";
import { PROJET_SECTION, type ProjetFieldName, type ProjetSection } from "../schema";

/** Exigés dans « Votre projet », dans l'ordre de la page (maquette 01). */
const PROJET_FIELDS: readonly ProjetFieldName[] = ["motivationChangement", "effetsChangement"];

/** Exigés dans « Vos compétences », dans l'ordre de la page (maquette 01). */
const COMPETENCES_FIELDS: readonly ProjetFieldName[] = [
  "competencesAcquises",
  "competencesAAcquerir",
];

const DEMARCHE_CONSTRUCTION_FIELD: ProjetFieldName = "demarcheConstruction";

/** Ce qui décide des champs des sections : la réponse sur les démarches, et où en est la démarche en cours de saisie. */
export interface SectionFieldsAnswers extends OpenDemarche {
  /** Absente tant que la question n'a pas de réponse. */
  demarcheConstruction?: OuiNon;
}

/**
 * Deux zones de texte pour le projet, deux pour les compétences, puis la question sur les
 * démarches et, après un « oui », la démarche en cours de saisie (maquettes 01 et 03).
 */
export function findSectionFields(
  answers: SectionFieldsAnswers,
): Record<ProjetSection, readonly ProjetFieldName[]> {
  return {
    [PROJET_SECTION.PROJET]: PROJET_FIELDS,
    [PROJET_SECTION.COMPETENCES]: COMPETENCES_FIELDS,
    [PROJET_SECTION.DEMARCHES]: [
      DEMARCHE_CONSTRUCTION_FIELD,
      ...findOpenDemarcheFields(answers.demarcheConstruction, answers),
    ],
  };
}
