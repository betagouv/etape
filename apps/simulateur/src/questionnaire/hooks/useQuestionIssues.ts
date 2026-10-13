"use client";

import { useState } from "react";

import type { Answers, AnswerValue, Question } from "../domain/types";
import { fieldIssues, ISSUE_KIND, type FieldIssue } from "../domain/validation";

interface UseQuestionIssuesOptions {
  question: Question;
  answers: Answers;
  setAnswer: (name: string, value: AnswerValue) => void;
  /** Tentative de « Continuer » échouée sur cette question, s'il y en a eu une. */
  failedAttempt?: number;
}

export interface UseQuestionIssuesResult {
  /** Problèmes à afficher maintenant, par nom de champ. */
  shown: ReadonlyMap<string, FieldIssue>;
  /** Texte de la région `role="status"` : vide au repos. */
  announcement: string;
  /** `setAnswer`, qui retire aussi l'erreur d'un champ dès qu'il est corrigé. */
  setAnswer: (name: string, value: AnswerValue) => void;
  /** À appeler à la sortie d'un champ : révèle les valeurs invalides. */
  revealInvalid: () => void;
}

/** Champs dont la valeur invalide a été révélée, pour UNE question. */
interface Revealed {
  questionId: string;
  names: readonly string[];
  announcement: string;
}

const isInvalid = (issue: FieldIssue | undefined): boolean => issue?.kind === ISSUE_KIND.INVALID;

/**
 * Quand afficher les problèmes d'une question.
 *
 * - Une valeur INVALIDE s'affiche à la sortie du champ, et disparaît dès qu'elle
 *   est corrigée — sans attendre une nouvelle sortie. Elle est annoncée par la
 *   région `role="status"` de l'écran : le focus, lui, est déjà ailleurs.
 * - Après un clic sur « Continuer » qui échoue, tout s'affiche, y compris les
 *   réponses manquantes ; c'est alors le déplacement du focus qui annonce.
 */
export function useQuestionIssues({
  question,
  answers,
  setAnswer,
  failedAttempt,
}: UseQuestionIssuesOptions): UseQuestionIssuesResult {
  const issues = fieldIssues(question, answers);

  const [state, setState] = useState<Revealed>({
    questionId: question.id,
    names: [],
    announcement: "",
  });
  // Changer de question repart de zéro, sans effet ni remise à zéro explicite.
  const revealed =
    state.questionId === question.id
      ? state
      : { questionId: question.id, names: [], announcement: "" };

  const shown = new Map(
    [...issues].filter(
      ([name, issue]) =>
        failedAttempt !== undefined || (isInvalid(issue) && revealed.names.includes(name)),
    ),
  );

  function revealInvalid() {
    const fresh = [...issues]
      .filter(([name, issue]) => isInvalid(issue) && !revealed.names.includes(name))
      .map(([name]) => name);
    if (fresh.length === 0) return;
    setState({
      questionId: question.id,
      names: [...revealed.names, ...fresh],
      announcement: issues.get(fresh[0])?.message ?? "",
    });
  }

  function setAnswerAndForget(name: string, value: AnswerValue) {
    setAnswer(name, value);
    if (!revealed.names.includes(name)) return;
    // La validité se juge sur la réponse À VENIR : celle de `answers` est déjà
    // périmée au moment de la frappe.
    const next = fieldIssues(question, { ...answers, [name]: value });
    if (isInvalid(next.get(name))) return;
    setState({
      questionId: question.id,
      names: revealed.names.filter((revealedName) => revealedName !== name),
      announcement: "",
    });
  }

  return {
    shown,
    announcement: revealed.announcement,
    setAnswer: setAnswerAndForget,
    revealInvalid,
  };
}
