"use client";

import { findOutcome, findQuestion, nextQuestionId, questions } from "../domain/questions";
import { isQuestionComplete } from "../domain/validation";
import { useFlow } from "./useFlow";

/**
 * Orchestration de la navigation par id : résout l'étape courante (question ou
 * écran terminal), l'activation des boutons, le passage à l'étape suivante (en
 * tenant compte du branchement) et le retour.
 */
export function useFlowNavigation() {
  const { state, dispatch } = useFlow();

  const question = findQuestion(state.currentId);
  const outcome = findOutcome(state.currentId);

  const isFirst = state.history.length === 0;
  const total = questions.length;
  const stepNumber = question ? questions.findIndex((q) => q.id === question.id) + 1 : 0;
  const isLast = !!question && question.id === questions[questions.length - 1].id;
  const canGoNext = question ? isQuestionComplete(question, state.answers) : false;

  function goNext() {
    if (!question || !canGoNext) return;
    // Branchement : la question peut désigner explicitement l'étape suivante
    // (une autre question OU un écran terminal) ; sinon on suit l'ordre.
    const explicit = question.next?.(state.answers) ?? null;
    const nextId = explicit ?? nextQuestionId(question.id);
    if (nextId) dispatch({ type: "GO", id: nextId });
    // Sinon : fin du parcours → écran de résultats (module `resultats/`, à venir).
  }

  function goPrev() {
    dispatch({ type: "BACK" });
  }

  return { question, outcome, stepNumber, total, isFirst, isLast, canGoNext, goNext, goPrev };
}
