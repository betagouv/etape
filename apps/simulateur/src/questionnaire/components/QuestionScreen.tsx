"use client";

import { useEffect, useRef, type RefObject } from "react";
import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@etape/ui/components/alert";

import { isFieldVisible } from "../domain/conditions";
import type { Answers, AnswerValue, Question } from "../domain/types";
import { ISSUE_KIND } from "../domain/validation";
import { useQuestionIssues } from "../hooks/useQuestionIssues";
import { FIELD_ERROR_ATTRIBUTE } from "./fields/aria";
import { QuestionFields } from "./QuestionFields";
import { QuestionHeader } from "./QuestionHeader";

interface QuestionScreenProps {
  question: Question;
  stepNumber: number;
  answers: Answers;
  setAnswer: (name: string, value: AnswerValue) => void;
  headingRef?: RefObject<HTMLHeadingElement | null>;
  /**
   * Numéro de la tentative de validation ayant échoué sur CETTE question, ou
   * `undefined` si l'utilisateur n'a encore rien tenté. Il change à chaque
   * nouvel essai : c'est ce qui redéplace le focus quand on reclique
   * « Continuer » sans avoir corrigé.
   */
  failedAttempt?: number;
}

/** Éléments capables de prendre le focus, pour le repli ci-dessous. */
const FOCUSABLE = 'input, select, textarea, button, [tabindex]:not([tabindex="-1"])';

/**
 * Amène le focus sur le premier champ fautif. C'est ce déplacement — et non un
 * `role="alert"` — qui annonce l'erreur : le lecteur d'écran lit l'élément
 * visé, son libellé et son message.
 *
 * L'élément marqué est visé DIRECTEMENT, y compris quand c'est un groupe :
 * c'est lui qui porte le libellé de la sous-question et le message, là où un
 * bouton radio ne porterait que son propre intitulé.
 */
function focusFirstInvalid(container: HTMLElement | null): void {
  const invalid = container?.querySelector<HTMLElement>(`[${FIELD_ERROR_ATTRIBUTE}="true"]`);
  if (!invalid) return;
  invalid.focus();
  // Filet : si l'élément marqué refuse le focus, viser son premier contrôle.
  if (document.activeElement !== invalid) {
    invalid.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  }
}

/** Une réponse absente se complète, une réponse invalide se corrige. */
function summarize(count: number, hasInvalid: boolean): string {
  if (hasInvalid) {
    return count === 1
      ? "Une réponse est à corriger pour continuer."
      : `${count} réponses sont à corriger pour continuer.`;
  }
  return count === 1
    ? "Une réponse manque : complétez-la pour continuer."
    : `${count} réponses manquent : complétez-les pour continuer.`;
}

export function QuestionScreen({
  question,
  stepNumber,
  answers,
  setAnswer,
  headingRef,
  failedAttempt,
}: QuestionScreenProps) {
  const titleId = `${question.id}-title`;
  const subtitleId = question.subtitle || question.notice ? `${question.id}-subtitle` : undefined;

  const {
    shown,
    announcement,
    setAnswer: answer,
    revealInvalid,
  } = useQuestionIssues({
    question,
    answers,
    setAnswer,
    failedAttempt,
  });
  const errors = new Map([...shown].map(([name, issue]) => [name, issue.message]));

  // Champ unique : un message, en bas. Plusieurs : un par champ, résumé en bas.
  // Une case à cocher n'est jamais en erreur.
  const inputFields = question.fields.filter(
    (field) => field.type !== "toggle" && isFieldVisible(field, answers),
  );
  const singleField = inputFields.length === 1 ? inputFields[0] : undefined;
  const singleIssue = singleField ? shown.get(singleField.name) : undefined;
  const hasInvalid = [...shown.values()].some((issue) => issue.kind === ISSUE_KIND.INVALID);
  const summary = summarize(shown.size, hasInvalid);

  // Sur un écran à champ unique, le message en bas EST celui du champ : il en
  // porte l'`id`, celui que l'`aria-describedby` du champ désigne déjà.
  const summaryId = singleField ? `${singleField.name}-error` : undefined;

  const fieldsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (failedAttempt === undefined) return;
    focusFirstInvalid(fieldsRef.current);
  }, [failedAttempt, question.id]);

  // `focusout` remonte de chaque contrôle : quitter un champ, y compris de
  // l'année vers le mois, révèle ce qui est invalide. Écouté sur le DOM plutôt
  // que par un `onBlur` posé sur un `<div>`, qui n'est pas un contrôle.
  useEffect(() => {
    const container = fieldsRef.current;
    container?.addEventListener("focusout", revealInvalid);
    return () => container?.removeEventListener("focusout", revealInvalid);
  }, [revealInvalid]);

  return (
    <div className="flex w-full flex-col gap-6 md:gap-10">
      <QuestionHeader
        step={stepNumber}
        question={question}
        titleId={titleId}
        subtitleId={subtitleId}
        headingRef={headingRef}
      />
      <div ref={fieldsRef}>
        <QuestionFields
          question={question}
          answers={answers}
          setAnswer={answer}
          titleId={titleId}
          describedBy={subtitleId}
          errors={errors}
          inlineErrors={singleField === undefined}
        />
      </div>
      {/* Visible mais pas annoncé : le focus part sur le premier champ fautif, qui le lit. */}
      {hasInvalid ? (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>Vérifiez votre saisie</AlertTitle>
          {singleIssue ? (
            <AlertDescription id={summaryId}>{singleIssue.message}</AlertDescription>
          ) : (
            shown.size > 1 && <AlertDescription>{summary}</AlertDescription>
          )}
        </Alert>
      ) : (
        shown.size > 0 && (
          <p
            id={summaryId}
            className="text-destructive-text text-sm leading-5 font-semibold md:text-base md:leading-6"
          >
            {singleIssue?.message ?? summary}
          </p>
        )
      )}
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
