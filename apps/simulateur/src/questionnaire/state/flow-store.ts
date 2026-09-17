import { pruneAnswers } from "../domain/flow";
import type { Answers } from "../domain/types";
import { flowReducer, initialFlowState, type FlowAction, type FlowState } from "./flow-reducer";

// Store externe (module singleton) lu via useSyncExternalStore.
// Les réponses vivent ici + sont persistées en sessionStorage (reprise après
// refresh), sans setState-dans-un-effet ni hydration mismatch.

/** À incrémenter dès que la forme de `FlowState` change. */
const STORAGE_KEY = "etape.flow.v3";

let state: FlowState = initialFlowState;
let initialized = false;
const listeners = new Set<() => void>();

function loadFromStorage(): FlowState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return initialFlowState;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return initialFlowState;

    const answers = (parsed as { answers?: unknown }).answers;
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return initialFlowState;
    }

    // Nettoyage à la relecture : un état déposé par une version antérieure du
    // questionnaire peut porter des réponses qui ne correspondent plus à aucun
    // champ posé. L'invariant du reducer vaut ainsi dès le premier rendu.
    return { answers: pruneAnswers(answers as Answers) };
  } catch {
    // Storage indisponible ou JSON corrompu.
    return initialFlowState;
  }
}

// Restaure depuis sessionStorage au premier accès côté navigateur.
// getSnapshot renvoie une référence stable tant que `state` ne change pas.
function getSnapshot(): FlowState {
  if (!initialized) {
    initialized = true;
    state = loadFromStorage();
  }
  return state;
}

// Rendu serveur / export statique : toujours l'état initial (pas de sessionStorage).
function getServerSnapshot(): FlowState {
  return initialFlowState;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function dispatch(action: FlowAction): void {
  state = flowReducer(state, action);
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage plein/indisponible : la navigation reste fonctionnelle.
  }
  listeners.forEach((listener) => listener());
}

export const flowStore = { subscribe, getSnapshot, getServerSnapshot, dispatch };
