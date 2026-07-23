import { flowReducer, initialFlowState, type FlowAction, type FlowState } from "./flow-reducer";

// Store externe (module singleton) lu via useSyncExternalStore.
// L'état vit ici + est persisté en sessionStorage (reprise après refresh),
// sans setState-dans-un-effet ni hydration mismatch.

const STORAGE_KEY = "etape.flow";

let state: FlowState = initialFlowState;
let initialized = false;
const listeners = new Set<() => void>();

function loadFromStorage(): FlowState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as FlowState;
  } catch {
    // Storage indisponible ou JSON corrompu.
  }
  return initialFlowState;
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
