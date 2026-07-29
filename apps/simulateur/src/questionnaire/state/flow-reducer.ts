import type { Answers, AnswerValue } from "../domain/types";

export interface FlowState {
  /** Réponses saisies, indexées par `name` de champ. */
  answers: Answers;
}

export type FlowAction =
  { type: "SET_ANSWER"; name: string; value: AnswerValue } | { type: "RESET" };

export const initialFlowState: FlowState = { answers: {} };

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case "SET_ANSWER":
      return { answers: { ...state.answers, [action.name]: action.value } };

    case "RESET":
      return initialFlowState;
  }
}
