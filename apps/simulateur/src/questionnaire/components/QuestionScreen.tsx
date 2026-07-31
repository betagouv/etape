"use client";

import type { RefObject } from "react";

import type { Answers, AnswerValue, Question } from "../domain/types";
import { FieldRenderer } from "./FieldRenderer";
import { QuestionHeader } from "./QuestionHeader";

interface QuestionScreenProps {
  question: Question;
  stepNumber: number;
  answers: Answers;
  setAnswer: (name: string, value: AnswerValue) => void;
  headingRef?: RefObject<HTMLHeadingElement | null>;
  showRequiredError?: boolean;
}

export function QuestionScreen({
  question,
  stepNumber,
  answers,
  setAnswer,
  headingRef,
  showRequiredError = false,
}: QuestionScreenProps) {
  const titleId = `${question.id}-title`;
  const subtitleId = question.subtitle ? `${question.id}-subtitle` : undefined;
  const errorId = `${question.id}-error`;
  const singleField = question.fields.length === 1;

  const describedBy =
    [subtitleId, showRequiredError ? errorId : undefined].filter(Boolean).join(" ") || undefined;

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
      <div className="flex w-full flex-col gap-6 md:gap-8">
        {question.fields.map((field) => (
          <FieldRenderer
            key={field.name}
            field={field}
            answers={answers}
            setAnswer={setAnswer}
            labelledBy={singleField ? titleId : undefined}
            describedBy={singleField ? describedBy : undefined}
          />
        ))}

        {showRequiredError && (
          <p
            id={errorId}
            role="alert"
            className="text-destructive-text text-sm leading-5 font-semibold md:text-base md:leading-6"
          >
            Aucune réponse sélectionnée : choisis une option pour continuer.
          </p>
        )}
      </div>
    </div>
  );
}
