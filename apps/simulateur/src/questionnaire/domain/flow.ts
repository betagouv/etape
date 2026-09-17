// Traversée du flow : rejoue le parcours depuis la 1re question posée en
// suivant l'applicabilité RÉELLE des questions. C'est la source unique pour :
//   - le calcul des flags d'un parcours (consommés par `resultats/`),
//   - l'étape suivante (navigation),
//   - le chemin réellement emprunté (récapitulatif des réponses),
//   - le total affiché par la barre de progression.
//
// Le parcours est une SÉQUENCE : les questions sont posées dans l'ordre du
// tableau, chacune sous réserve de son prédicat `when`. Une question peut en
// outre porter une porte de sortie (`outcome`) qui interrompt le parcours.

import { isFieldVisible } from "./conditions";
import { findOutcome, findQuestion, questions, STEP_RESULTS } from "./questions";
import type { Answers, Field, Question } from "./types";
import { isQuestionComplete } from "./validation";

/** La question est-elle posée pour ces réponses ? */
function applies(question: Question, answers: Answers): boolean {
  return question.when?.(answers) ?? true;
}

/** Questions effectivement posées, dans l'ordre du parcours. */
function applicableQuestions(answers: Answers): Question[] {
  return questions.filter((question) => applies(question, answers));
}

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
  return []; // Les champs de saisie (mois, nombre, région, case) n'en portent pas.
}

/** Cumule dans `flags` les flags des champs visibles et renseignés d'une question. */
function addQuestionFlags(question: Question, answers: Answers, flags: Set<string>): void {
  for (const field of question.fields) {
    if (!isFieldVisible(field, answers)) continue;
    for (const flag of fieldFlags(field, answers)) flags.add(flag);
  }
}

/** Première question posée du parcours. */
function firstStepId(answers: Answers): string {
  return applicableQuestions(answers)[0]?.id ?? STEP_RESULTS;
}

/** Question posée juste après `currentId` dans l'ordre du tableau. */
function nextApplicableId(currentId: string, answers: Answers): string | null {
  const posees = applicableQuestions(answers);
  const index = posees.findIndex((question) => question.id === currentId);
  if (index < 0 || index + 1 >= posees.length) return null;
  return posees[index + 1].id;
}

/** Étape suivante d'une question : la question posée juste après elle. */
function resolveNext(question: Question, answers: Answers): string {
  return nextApplicableId(question.id, answers) ?? STEP_RESULTS;
}

export interface FlowWalk {
  /** Flags accumulés le long du chemin parcouru (questions répondues). */
  flags: Set<string>;
  /** Ids des questions effectivement sur le chemin, dans l'ordre. */
  path: string[];
  /**
   * Étape suivante à afficher : id d'une question NON encore répondue, id d'un
   * écran terminal (outcome), ou `STEP_RESULTS` si le chemin est complet.
   */
  next: string;
}

/**
 * Rejoue le parcours depuis la 1re question et s'arrête à la 1re question non
 * répondue (renvoyée dans `next`), à une porte de sortie, ou à `STEP_RESULTS`.
 */
export function walkFlow(answers: Answers): FlowWalk {
  const flags = new Set<string>();
  const path: string[] = [];
  let id = firstStepId(answers);

  // Borne anti-boucle : la séquence est finie, mais on se protège.
  for (let guard = 0; guard <= questions.length + 1; guard++) {
    if (id === STEP_RESULTS) return { flags, path, next: STEP_RESULTS };
    if (findOutcome(id)) return { flags, path, next: id };
    const question = findQuestion(id);
    if (!question) return { flags, path, next: STEP_RESULTS };
    if (!isQuestionComplete(question, answers)) return { flags, path, next: id };
    addQuestionFlags(question, answers, flags);
    path.push(id);
    const outcome = question.outcome?.(flags);
    if (outcome) return { flags, path, next: outcome };
    id = resolveNext(question, answers);
  }
  return { flags, path, next: STEP_RESULTS };
}

/**
 * Le parcours s'arrête-t-il sur un écran terminal (outcome) ?
 * Un tel parcours n'est pas reprenable : les réponses ne mènent nulle part
 * ailleurs qu'à ce cul-de-sac, autant les effacer.
 */
export function endsOnOutcome(answers: Answers): boolean {
  return findOutcome(walkFlow(answers).next) !== undefined;
}

/**
 * Étape immédiatement après `currentId`, une fois celle-ci répondue.
 * Rejoue le chemin pour disposer des flags corrects au point de sortie.
 */
export function stepAfter(currentId: string, answers: Answers): string {
  const flags = new Set<string>();

  for (const question of applicableQuestions(answers)) {
    addQuestionFlags(question, answers, flags);
    if (question.id !== currentId) continue;
    return question.outcome?.(flags) ?? resolveNext(question, answers);
  }
  return STEP_RESULTS;
}

/**
 * Nombre de questions du parcours, pour le denominateur de la progression.
 *
 * Une question conditionnelle qui ne s'applique pas continue d'être comptée
 * tant que la réponse dont elle dépend est inconnue (`pending`) : le total part
 * du chemin le plus long et ne peut que raccourcir. Les questions d'une même
 * bifurcation (`branch`) s'excluant, une seule d'entre elles est comptée.
 */
export function totalSteps(answers: Answers): number {
  const countedBranches = new Set<string>();
  let total = 0;

  for (const question of questions) {
    if (applies(question, answers)) {
      total++;
      continue;
    }
    if (!question.pending?.(answers)) continue;
    if (question.branch !== undefined) {
      if (countedBranches.has(question.branch)) continue;
      countedBranches.add(question.branch);
    }
    total++;
  }
  return total;
}

// ─── Nettoyage des réponses hors-parcours ─────────────────────────────────

/** Noms des champs actuellement posés (question applicable + champ visible). */
function reachableFieldNames(answers: Answers): Set<string> {
  const names = new Set<string>();
  for (const question of questions) {
    if (!applies(question, answers)) continue;
    for (const field of question.fields) {
      if (isFieldVisible(field, answers)) names.add(field.name);
    }
  }
  return names;
}

/** Une passe de nettoyage. Renvoie `answers` inchangé s'il n'y a rien à retirer. */
function prunePass(answers: Answers): Answers {
  const reachable = reachableFieldNames(answers);
  const orphans = Object.keys(answers).filter((name) => !reachable.has(name));
  if (orphans.length === 0) return answers;

  const pruned = { ...answers };
  for (const name of orphans) delete pruned[name];
  return pruned;
}

/**
 * Efface les réponses sorties du parcours : celles d'une question qui ne
 * s'applique plus, et celles d'un champ masqué par sa condition.
 *
 * Le ticket l'exige (« les champs complémentaires sont masqués ET vidés lorsque
 * la condition n'est plus remplie »). Sans cela, une branche abandonnée
 * continue de poser ses flags et de peupler le récapitulatif.
 *
 * Itère jusqu'au point fixe : retirer une réponse peut en masquer une autre
 * (situation → contrat → statut cadre).
 */
export function pruneAnswers(answers: Answers): Answers {
  let current = answers;
  for (let pass = 0; pass <= questions.length; pass++) {
    const next = prunePass(current);
    if (next === current) break;
    current = next;
  }
  return current;
}
