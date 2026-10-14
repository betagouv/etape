"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { stepAfter, totalSteps, walkFlow, type FlowWalk } from "../domain/flow";
import { findOutcome, findQuestion, STEP_RESULTS } from "../domain/questions";
import type { Outcome, Question } from "../domain/types";
import { isQuestionComplete } from "../domain/validation";
import { useFlow } from "./useFlow";

/** Nom du paramètre d'URL qui porte l'étape courante. */
export const STEP_PARAM = "q";

/**
 * Présent quand on modifie une réponse depuis les résultats : « Continuer » mène
 * alors à la première question incomplète, ou directement aux résultats.
 */
const EDIT_PARAM = "edit";

export interface UseFlowNavigationResult {
  /** Question de l'étape courante ; absente sur un écran terminal ou les résultats. */
  question: Question | undefined;
  /** Écran terminal de l'étape courante, s'il y en a un. */
  outcome: Outcome | undefined;
  isResults: boolean;
  stepNumber: number;
  total: number;
  isFirst: boolean;
  isLast: boolean;
  canGoNext: boolean;
  goNext: () => void;
  goPrev: () => void;
  editAnswer: (id: string) => void;
  restart: () => void;
}

function stepSearch(id: string, isEditing: boolean): string {
  return isEditing && id !== STEP_RESULTS
    ? `?${STEP_PARAM}=${id}&${EDIT_PARAM}`
    : `?${STEP_PARAM}=${id}`;
}

/** Seul point de contact avec l'historique navigateur. */
const stepUrl = {
  push: (id: string, isEditing = false) =>
    window.history.pushState(null, "", stepSearch(id, isEditing)),
  replace: (id: string, isEditing = false) =>
    window.history.replaceState(null, "", stepSearch(id, isEditing)),
};

/** Une étape venant de l'URL n'est honorée que si le parcours réel y mène. */
function isReachable(id: string, walk: FlowWalk): boolean {
  // Un écran terminal comme les autres : « Recommencer la simulation » efface
  // les réponses, et l'écran doit alors céder la place à la 1re question.
  if (id === STEP_RESULTS) return walk.next === STEP_RESULTS;
  return walk.path.includes(id) || walk.next === id;
}

/**
 * Orchestration de la navigation : l'étape courante est lue dans l'URL, le rang
 * et la progression sont dérivés du chemin réellement emprunté (`walkFlow`).
 */
export function useFlowNavigation(): UseFlowNavigationResult {
  const { state, hydrated, dispatch } = useFlow();
  const searchParams = useSearchParams();
  const requested = searchParams.get(STEP_PARAM);
  const isEditing = searchParams.has(EDIT_PARAM);

  const walk = walkFlow(state.answers);
  const currentId = requested && isReachable(requested, walk) ? requested : walk.next;

  // Attendre `hydrated` : sinon les réponses sont encore vides et un `?q=`
  // profond serait réécrit vers la 1re question à chaque rechargement.
  useEffect(() => {
    if (!hydrated) return;
    if (requested !== currentId) stepUrl.replace(currentId, isEditing);
  }, [hydrated, requested, currentId, isEditing]);

  const isResults = currentId === STEP_RESULTS;
  const question = isResults ? undefined : findQuestion(currentId);
  const outcome = findOutcome(currentId);

  const indexOnPath = question ? walk.path.indexOf(question.id) : -1;
  const stepNumber = indexOnPath >= 0 ? indexOnPath + 1 : walk.path.length + 1;

  // Question précédente DANS LE PARCOURS. L'historique navigateur ne la contient
  // pas forcément : une reprise ou un lien profond arrive directement à l'étape
  // courante, sans entrée pour celles d'avant.
  const previousId =
    indexOnPath > 0
      ? walk.path[indexOnPath - 1]
      : indexOnPath < 0 && walk.path.length > 0
        ? walk.path[walk.path.length - 1]
        : undefined;

  const isFirst = !previousId;
  // Total = nombre de questions du parcours (il raccourcit quand une question
  // conditionnelle est écartée, il ne s'allonge jamais). Sur un écran terminal
  // ou les résultats, le parcours est figé : sa longueur est celle du chemin.
  const total = question ? totalSteps(state.answers) : walk.path.length;
  const canGoNext = question ? isQuestionComplete(question, state.answers) : false;
  // En modification, les questions déjà répondues qui suivent sont sautées.
  const next = question
    ? isEditing && canGoNext
      ? walk.next
      : stepAfter(question.id, state.answers)
    : undefined;
  // Dernière question aussi quand elle mène à un écran terminal : la personne
  // qui réside hors de France (Q7) voit le même « Voir mes résultats », que la
  // porte de sortie lui réponde ou non (maquette Q7, « Hors de France »).
  const isLast = next === STEP_RESULTS || (next !== undefined && findOutcome(next) !== undefined);

  function goNext() {
    if (!next || !canGoNext) return;
    stepUrl.push(next, isEditing);
  }

  function goPrev() {
    if (previousId) stepUrl.push(previousId, isEditing);
  }

  function editAnswer(id: string) {
    stepUrl.push(id, true);
  }

  function restart() {
    dispatch({ type: "RESET" });
    stepUrl.replace(walkFlow({}).next);
  }

  return {
    question,
    outcome,
    isResults,
    stepNumber,
    total,
    isFirst,
    isLast,
    canGoNext,
    goNext,
    goPrev,
    editAnswer,
    restart,
  };
}
