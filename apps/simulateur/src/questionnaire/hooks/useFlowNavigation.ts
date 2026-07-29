"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { maxDepthFrom, stepAfter, walkFlow, type FlowWalk } from "../domain/flow";
import { findOutcome, findQuestion, STEP_RESULTS } from "../domain/questions";
import { isQuestionComplete } from "../domain/validation";
import { useFlow } from "./useFlow";

/** Nom du paramètre d'URL qui porte l'étape courante. */
export const STEP_PARAM = "q";

/** Seul point de contact avec l'historique navigateur. */
const stepUrl = {
  push: (id: string) => window.history.pushState(null, "", `?${STEP_PARAM}=${id}`),
  replace: (id: string) => window.history.replaceState(null, "", `?${STEP_PARAM}=${id}`),
  back: () => window.history.back(),
};

/** Une étape venant de l'URL n'est honorée que si le parcours réel y mène. */
function isReachable(id: string, walk: FlowWalk): boolean {
  if (findOutcome(id)) return true;
  if (id === STEP_RESULTS) return walk.next === STEP_RESULTS;
  return walk.path.includes(id) || walk.next === id;
}

/**
 * Orchestration de la navigation : l'étape courante est lue dans l'URL, le rang
 * et la progression sont dérivés du chemin réellement emprunté (`walkFlow`).
 */
export function useFlowNavigation() {
  const { state, hydrated, dispatch } = useFlow();
  const requested = useSearchParams().get(STEP_PARAM);

  const walk = walkFlow(state.answers);
  const currentId = requested && isReachable(requested, walk) ? requested : walk.next;

  // Attendre `hydrated` : sinon les réponses sont encore vides et un `?q=`
  // profond serait réécrit vers la 1re question à chaque rechargement.
  useEffect(() => {
    if (!hydrated) return;
    if (requested !== currentId) stepUrl.replace(currentId);
  }, [hydrated, requested, currentId]);

  const isResults = currentId === STEP_RESULTS;
  const question = isResults ? undefined : findQuestion(currentId);
  const outcome = findOutcome(currentId);

  const indexOnPath = question ? walk.path.indexOf(question.id) : -1;
  const stepNumber = indexOnPath >= 0 ? indexOnPath + 1 : walk.path.length + 1;

  const isFirst = stepNumber <= 1;
  const total = question ? stepNumber - 1 + maxDepthFrom(question.id) : walk.path.length;
  const canGoNext = question ? isQuestionComplete(question, state.answers) : false;
  const isLast = !!question && stepAfter(question.id, state.answers) === STEP_RESULTS;

  function goNext() {
    if (!question || !canGoNext) return;
    stepUrl.push(stepAfter(question.id, state.answers));
  }

  function goPrev() {
    stepUrl.back();
  }

  function goTo(id: string) {
    stepUrl.push(id);
  }

  function restart() {
    dispatch({ type: "RESET" });
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
    goTo,
    restart,
  };
}
