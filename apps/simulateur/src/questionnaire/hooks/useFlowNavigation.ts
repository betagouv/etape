"use client";

import { maxDepthFrom, stepAfter } from "../domain/flow";
import { findOutcome, findQuestion, STEP_RESULTS } from "../domain/questions";
import { isQuestionComplete } from "../domain/validation";
import { useFlow } from "./useFlow";

/**
 * Orchestration de la navigation par id : résout l'étape courante (question,
 * écran terminal ou écran de résultats), l'activation des boutons, le passage à
 * l'étape suivante (branchement par flags) et le retour.
 */
export function useFlowNavigation() {
  const { state, dispatch } = useFlow();

  const isResults = state.currentId === STEP_RESULTS;
  const question = isResults ? undefined : findQuestion(state.currentId);
  const outcome = findOutcome(state.currentId);

  const isFirst = state.history.length === 0;
  const stepNumber = state.history.length + 1;
  // Total dynamique : étapes complétées + plus longue continuation restante
  // (question courante comprise). Sert uniquement à la barre de progression.
  const total = question ? state.history.length + maxDepthFrom(question.id) : state.history.length;
  const canGoNext = question ? isQuestionComplete(question, state.answers) : false;
  // La dernière question est celle dont l'étape suivante est l'écran résultats.
  const isLast = !!question && stepAfter(question.id, state.answers) === STEP_RESULTS;

  function goNext() {
    if (!question || !canGoNext) return;
    dispatch({ type: "GO", id: stepAfter(question.id, state.answers) });
  }

  function goPrev() {
    dispatch({ type: "BACK" });
  }

  /** Revenir modifier une question depuis l'écran de résultats. */
  function goTo(id: string) {
    dispatch({ type: "GO", id });
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
