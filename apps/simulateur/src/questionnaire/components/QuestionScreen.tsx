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

  // Un écran à champ unique (Q1, Q2, Q4, Q5, Q7) porte son message une seule
  // fois, en bas. Un écran qui en a plusieurs (Q3, Q6) garde un message sous
  // chaque champ fautif — une ligne unique ne dirait pas LEQUEL — et se résume
  // en bas au nombre de réponses en attente. Une case à cocher ne compte pas :
  // elle n'est jamais en erreur (Q5 et sa case « moins d'un an »).
  const saisies = question.fields.filter(
    (field) => field.type !== "toggle" && isFieldVisible(field, answers),
  );
  const champUnique = saisies.length === 1 ? saisies[0] : undefined;
  const issueUnique = champUnique ? shown.get(champUnique.name) : undefined;

  // Une réponse absente ne se « corrige » pas, elle se donne ; une réponse
  // invalide est là mais fausse. Le résumé le dit avec le bon verbe.
  const absences = [...shown.values()].filter((issue) => issue.kind === ISSUE_KIND.MISSING).length;
  const resume =
    shown.size === absences
      ? shown.size === 1
        ? "Une réponse manque : complétez-la pour continuer."
        : `${shown.size} réponses manquent : complétez-les pour continuer.`
      : shown.size === 1
        ? "Une réponse est à corriger pour continuer."
        : `${shown.size} réponses sont à corriger pour continuer.`;

  // Sur un écran à champ unique, le message en bas EST celui du champ : il en
  // porte l'`id`, celui que l'`aria-describedby` du champ désigne déjà.
  const bilanId = champUnique ? `${champUnique.name}-error` : undefined;

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
        title={question.title}
        subtitle={question.subtitle}
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
          inlineErrors={champUnique === undefined}
        />
      </div>
      {/* Le bilan est visible mais pas annoncé : après un clic sur
          « Continuer », le focus part sur le premier champ fautif, qui le lit.
          Une valeur invalide révélée à la sortie du champ passe, elle, par la
          région ci-dessous. */}
      {issueUnique?.kind === ISSUE_KIND.INVALID ? (
        // Valeur impossible (maquettes « Completed invalid ») : un encart, dont
        // le titre est celui de la maquette et la description dit quoi corriger.
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>Vérifiez votre saisie</AlertTitle>
          <AlertDescription id={bilanId}>{issueUnique.message}</AlertDescription>
        </Alert>
      ) : (
        shown.size > 0 && (
          <p
            id={bilanId}
            className="text-destructive-text text-sm leading-5 font-semibold md:text-base md:leading-6"
          >
            {issueUnique?.message ?? resume}
          </p>
        )
      )}
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
