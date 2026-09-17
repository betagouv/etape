import { pruneAnswers } from "../domain/flow";
import type { Answers, AnswerValue } from "../domain/types";

export interface FlowState {
  /** Réponses saisies, indexées par `name` de champ. */
  answers: Answers;
}

export type FlowAction =
  { type: "SET_ANSWER"; name: string; value: AnswerValue } | { type: "RESET" };

export const initialFlowState: FlowState = { answers: {} };

/**
 * INVARIANT : `answers` ne contient que des réponses encore dans le parcours.
 * Toute écriture passe par `pruneAnswers`, qui efface celles dont la condition
 * vient de tomber — c'est là, et nulle part ailleurs, que le nettoyage a lieu.
 */
export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case "SET_ANSWER":
      return { answers: pruneAnswers({ ...state.answers, [action.name]: action.value }) };

    case "RESET":
      return initialFlowState;
  }
}
