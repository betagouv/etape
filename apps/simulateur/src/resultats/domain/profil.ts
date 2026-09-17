// Profil : tout ce que le catalogue a besoin de savoir d'un parcours, et rien
// de plus.
//
// Deux natures d'information s'y mélangent, et c'est voulu :
//   - les FLAGS, posés par les options choisies (salarié·e, CDI, RQTH…) ;
//   - deux DURÉES, qui viennent de champs de saisie et n'ont donc pas de flag
//     (Q4 l'ancienneté chez l'employeur, Q5 la durée totale d'activité).
// Les traduire ici une fois évite que chaque règle du catalogue reparse les
// réponses brutes.

import { monthsSince, parseMonth } from "@/questionnaire/domain/month";
import type { FlagSet } from "@/questionnaire/domain/flags";
import { walkFlow } from "@/questionnaire/domain/flow";
import { FIELD_DUREE_ACTIVITE, FIELD_ENTREE_EMPLOYEUR } from "@/questionnaire/domain/questions";
import { regionFromAnswers, type RegionCode } from "@/questionnaire/domain/regions";
import type { Answers } from "@/questionnaire/domain/types";

export interface Profil {
  /** Flags accumulés le long du parcours réellement emprunté. */
  flags: FlagSet;
  /** Région retenue pour les liens régionalisés (travail, sinon résidence). */
  region: RegionCode | null;
  /**
   * Ancienneté chez l'employeur actuel, en mois révolus (Q4). `null` quand la
   * question n'a pas été posée — sans employeur, il n'y a pas d'ancienneté.
   */
  ancienneteMois: number | null;
  /** Durée totale d'activité déclarée, en années (Q5). `null` si non renseignée. */
  activiteAnnees: number | null;
}

/** Nombre d'années saisi en Q5. La valeur est stockée telle que tapée. */
function anneesSaisies(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  return Number(value);
}

/** Ancienneté en mois d'après le mois d'entrée saisi en Q4. */
function ancienneteEnMois(value: unknown): number | null {
  const month = parseMonth(value);
  return month ? monthsSince(month) : null;
}

export function buildProfil(answers: Answers): Profil {
  return {
    flags: walkFlow(answers).flags,
    region: regionFromAnswers(answers),
    ancienneteMois: ancienneteEnMois(answers[FIELD_ENTREE_EMPLOYEUR]),
    activiteAnnees: anneesSaisies(answers[FIELD_DUREE_ACTIVITE]),
  };
}
