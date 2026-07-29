// Traversée du flow : rejoue le parcours depuis la 1re question en suivant le
// branchement RÉEL (basé sur les flags). C'est la source unique pour :
//   - le calcul des flags d'un parcours (consommés par `resultats/`),
//   - l'étape suivante (navigation),
//   - le chemin réellement emprunté (récapitulatif des réponses),
//   - la profondeur restante (barre de progression).
//
// En rejouant le chemin, on ignore naturellement les réponses ORPHELINES
// laissées par une branche abandonnée (ex. l'utilisateur revient en arrière et
// change un statut) : seules les questions atteignables comptent.

import { isFieldVisible } from "./conditions";
import { FLAGS } from "./flags";
import { findQuestion, nextQuestionId, questions, STEP_RESULTS } from "./questions";
import type { Answers, Field, Question } from "./types";
import { isQuestionComplete } from "./validation";

/** Flags contribués par la valeur retenue d'un champ visible. */
function fieldFlags(field: Field, answers: Answers): string[] {
  const value = answers[field.name];
  if (field.type === "radio") {
    if (typeof value !== "string") return [];
    return field.options.find((option) => option.value === value)?.flags ?? [];
  }
  if (field.type === "checkbox") {
    if (!Array.isArray(value)) return [];
    return field.options
      .filter((option) => value.includes(option.value))
      .flatMap((option) => option.flags ?? []);
  }
  return []; // "city" ne porte pas de flags.
}

/** Cumule dans `flags` les flags des champs visibles et renseignés d'une question. */
function addQuestionFlags(question: Question, answers: Answers, flags: Set<string>): void {
  for (const field of question.fields) {
    if (!isFieldVisible(field, answers)) continue;
    for (const flag of fieldFlags(field, answers)) flags.add(flag);
  }
}

/** Résout l'étape suivante d'une question (branchement, puis ordre du tableau). */
function resolveNext(question: Question, flags: Set<string>): string {
  return question.next?.(flags) ?? nextQuestionId(question.id) ?? STEP_RESULTS;
}

export interface FlowWalk {
  /** Flags accumulés le long du chemin parcouru (questions répondues). */
  flags: Set<string>;
  /** Ids des questions effectivement sur le chemin, dans l'ordre. */
  path: string[];
  /**
   * Étape suivante à afficher : id d'une question NON encore répondue, ou
   * `STEP_RESULTS` si le chemin est complet.
   */
  next: string;
}

/**
 * Rejoue le parcours depuis la 1re question et s'arrête à la 1re question non
 * répondue (renvoyée dans `next`) ou à `STEP_RESULTS`.
 */
export function walkFlow(answers: Answers): FlowWalk {
  const flags = new Set<string>();
  const path: string[] = [];
  let id = questions[0]?.id ?? STEP_RESULTS;

  // Borne anti-boucle : le graphe est un DAG, mais on se protège.
  for (let guard = 0; guard <= questions.length + 1; guard++) {
    if (id === STEP_RESULTS) return { flags, path, next: STEP_RESULTS };
    const question = findQuestion(id);
    if (!question) return { flags, path, next: STEP_RESULTS };
    if (!isQuestionComplete(question, answers)) return { flags, path, next: id };
    addQuestionFlags(question, answers, flags);
    path.push(id);
    id = resolveNext(question, flags);
  }
  return { flags, path, next: STEP_RESULTS };
}

/**
 * Étape immédiatement après `currentId`, une fois celle-ci répondue.
 * Rejoue le chemin pour disposer des flags corrects au point de branchement.
 */
export function stepAfter(currentId: string, answers: Answers): string {
  const flags = new Set<string>();
  let id = questions[0]?.id ?? STEP_RESULTS;

  for (let guard = 0; guard <= questions.length + 1; guard++) {
    if (id === STEP_RESULTS) return STEP_RESULTS;
    const question = findQuestion(id);
    if (!question) return STEP_RESULTS;
    addQuestionFlags(question, answers, flags);
    if (id === currentId) return resolveNext(question, flags);
    id = resolveNext(question, flags);
  }
  return STEP_RESULTS;
}

// ─── Profondeur restante (barre de progression) ───────────────────────────
// Le branchement dépendant des flags, on énumère les cibles possibles d'une
// question en sondant `next` avec l'ensemble vide, chaque flag isolé, puis
// l'ensemble complet (qui couvre les branches exigeant plusieurs flags).
// On en déduit la plus longue continuation par un DFS mémoïsé (le graphe est un DAG).

function possibleNextIds(question: Question): string[] {
  const allFlags = Object.values(FLAGS);
  const targets = new Set<string>();
  targets.add(resolveNext(question, new Set()));
  for (const flag of allFlags) targets.add(resolveNext(question, new Set([flag])));
  targets.add(resolveNext(question, new Set(allFlags)));
  return [...targets];
}

const depthCache = new Map<string, number>();

/** Nombre maximal de questions restantes à partir de `id` (celle-ci comprise). */
export function maxDepthFrom(id: string): number {
  if (id === STEP_RESULTS) return 0;
  const cached = depthCache.get(id);
  if (cached !== undefined) return cached;
  const question = findQuestion(id);
  if (!question) return 0;
  depthCache.set(id, 1); // garde-fou anti-cycle
  const depth = 1 + Math.max(0, ...possibleNextIds(question).map(maxDepthFrom));
  depthCache.set(id, depth);
  return depth;
}
