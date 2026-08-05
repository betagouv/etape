// Région du parcours. Certains liens des résultats sont régionalisés (portail
// CEP) : on déduit la région des questions de localisation, la commune renvoyée
// par geo.api.gouv.fr portant le code INSEE de sa région.

import {
  FIELD_LIEU_TRAVAIL,
  FIELD_VILLE_RESIDENCE,
  FIELD_VILLE_TRAVAIL,
  LOC_HORS_FRANCE,
} from "./questions";
import type { Answers, AnswerValue } from "./types";

/**
 * Codes INSEE de région renvoyés par geo.api.gouv.fr. Les trois derniers sont
 * des collectivités d'outre-mer, que l'API expose comme des régions à part.
 */
// prettier-ignore
export const REGION_CODES = [
  "11", "24", "27", "28", "32", "44", "52", "53", "75", "76", "84", "93", "94", // métropole
  "01", "02", "03", "04", "06",                                                // DROM
  "975", "977", "978",                                                         // COM
] as const;

export type RegionCode = (typeof REGION_CODES)[number];

function isRegionCode(code: string | undefined): code is RegionCode {
  return code !== undefined && (REGION_CODES as readonly string[]).includes(code);
}

/** Région de la commune répondue pour un champ « ville », si exploitable. */
function regionOf(value: AnswerValue | undefined): RegionCode | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return isRegionCode(value.region?.code) ? value.region.code : null;
}

/**
 * Région retenue pour les liens régionalisés : celle du lieu de TRAVAIL (Q1) ;
 * si l'utilisateur travaille hors de France, celle de sa RÉSIDENCE (Q2).
 * `null` quand la réponse retenue ne permet pas de la déterminer (ville non
 * renseignée, ou réponse antérieure à l'ajout du champ `region`).
 */
export function regionFromAnswers(answers: Answers): RegionCode | null {
  const cityField =
    answers[FIELD_LIEU_TRAVAIL] === LOC_HORS_FRANCE ? FIELD_VILLE_RESIDENCE : FIELD_VILLE_TRAVAIL;
  return regionOf(answers[cityField]);
}
