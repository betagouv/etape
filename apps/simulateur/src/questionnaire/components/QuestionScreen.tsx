"use client";

import type { Answers, AnswerValue, Question } from "../domain/types";
import { FieldRenderer } from "./FieldRenderer";
import { QuestionHeader } from "./QuestionHeader";

interface QuestionScreenProps {
  question: Question;
  stepNumber: number;
  answers: Answers;
  setAnswer: (name: string, value: AnswerValue) => void;
}

/** Rendu d'une question : entête + champs. Purement présentationnel. */
export function QuestionScreen({ question, stepNumber, answers, setAnswer }: QuestionScreenProps) {
  return (
    <div className="flex w-full flex-col gap-12">
      <QuestionHeader step={stepNumber} title={question.title} subtitle={question.subtitle} />
      <div className="flex w-full flex-col gap-8">
        {question.fields.map((field) => (
          <FieldRenderer key={field.name} field={field} answers={answers} setAnswer={setAnswer} />
        ))}
      </div>
    </div>
  );
}
