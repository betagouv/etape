import { questions } from "../domain/questions";
import type { Answers, AnswerValue } from "../domain/types";

export interface FlowState {
  /** Réponses saisies, indexées par `name` de champ. */
  answers: Answers;
  /** Id de l'étape courante (question OU écran terminal). */
  currentId: string;
  /** Pile des étapes visitées, pour le bouton "Précédent". */
  history: string[];
}

export type FlowAction =
  | { type: "SET_ANSWER"; name: string; value: AnswerValue }
  | { type: "GO"; id: string }
  | { type: "BACK" }
  | { type: "RESET" }
  | { type: "HYDRATE"; state: FlowState };

export const initialFlowState: FlowState = {
  answers: {},
  currentId: questions[0].id,
  history: [],
};

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case "SET_ANSWER":
      return { ...state, answers: { ...state.answers, [action.name]: action.value } };

    case "GO":
      return {
        ...state,
        currentId: action.id,
        history: [...state.history, state.currentId],
      };

    case "BACK": {
      if (state.history.length === 0) return state;
      const previous = state.history[state.history.length - 1];
      return {
        ...state,
        currentId: previous,
        history: state.history.slice(0, -1),
      };
    }

    case "RESET":
      return initialFlowState;

    case "HYDRATE":
      return action.state;
  }
}
