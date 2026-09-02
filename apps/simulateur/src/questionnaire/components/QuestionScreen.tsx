"use client";

import { useEffect, useRef, type RefObject } from "react";

import type { Answers, AnswerValue, Question } from "../domain/types";
import { fieldErrors, missingFields } from "../domain/validation";
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
   * « Suivant » sans avoir corrigé.
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

export function QuestionScreen({
  question,
  stepNumber,
  answers,
  setAnswer,
  headingRef,
  failedAttempt,
}: QuestionScreenProps) {
  const titleId = `${question.id}-title`;
  const subtitleId = question.subtitle ? `${question.id}-subtitle` : undefined;

  const showErrors = failedAttempt !== undefined;
  const errors = showErrors ? fieldErrors(question, answers) : new Map<string, string>();
  // Une réponse absente ne se « corrige » pas, elle se donne ; une réponse
  // incohérente est là mais fausse. Le résumé le dit avec le bon verbe.
  const absences = showErrors ? missingFields(question, answers).length : 0;
  const resume =
    errors.size === absences
      ? errors.size === 1
        ? "Une réponse manque pour continuer."
        : `${errors.size} réponses manquent pour continuer.`
      : errors.size === 1
        ? "Une réponse est à corriger pour continuer."
        : `${errors.size} réponses sont à corriger pour continuer.`;

  const fieldsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (failedAttempt === undefined) return;
    focusFirstInvalid(fieldsRef.current);
  }, [failedAttempt, question.id]);

  return (
    <div className="flex w-full flex-col gap-8 md:gap-12">
      <QuestionHeader
        step={stepNumber}
        title={question.title}
        subtitle={question.subtitle}
        titleId={titleId}
        subtitleId={subtitleId}
        headingRef={headingRef}
      />
      {/* Le récapitulatif est visible mais pas annoncé : le focus part sur le
          premier champ fautif, et deux annonces se marcheraient dessus. */}
      {errors.size > 0 && (
        <p className="text-destructive-text text-sm leading-5 font-semibold md:text-base md:leading-6">
          {resume}
        </p>
      )}
      <div ref={fieldsRef}>
        <QuestionFields
          question={question}
          answers={answers}
          setAnswer={setAnswer}
          titleId={titleId}
          describedBy={subtitleId}
          errors={errors}
        />
      </div>
    </div>
  );
}
