"use client";

import { isFieldVisible, opensUnder } from "../domain/conditions";
import type { Answers, AnswerValue, Field, Question } from "../domain/types";
import { fieldErrorMessage } from "../domain/validation";
import { FieldRenderer } from "./FieldRenderer";

interface QuestionFieldsProps {
  question: Question;
  answers: Answers;
  setAnswer: (name: string, value: AnswerValue) => void;
  /** Id du titre de la question, prêté au champ quand il est seul sur l'écran. */
  titleId: string;
  describedBy?: string;
  /** Champs à signaler en erreur, par `name`. Vide tant que rien n'a été tenté. */
  missing?: ReadonlySet<string>;
}

/**
 * Les champs d'une question.
 *
 * Une précision (`sub`) s'ouvre SOUS l'option qui la déclenche, dans le même
 * écran : le lien entre le choix et ce qu'il ouvre reste visible, plutôt que de
 * renvoyer l'utilisateur en bas de page. Les champs de premier niveau se
 * suivent normalement.
 */
export function QuestionFields({
  question,
  answers,
  setAnswer,
  titleId,
  describedBy,
  missing,
}: QuestionFieldsProps) {
  const mainFields = question.fields.filter((field) => field.sub === undefined);
  const subFields = question.fields.filter((field) => field.sub !== undefined);

  // Le titre ne peut nommer qu'un champ : dès qu'il y en a plusieurs, chacun
  // porte son propre libellé.
  const single = question.fields.length === 1;
  const labelledBy = single ? titleId : undefined;
  const inherited = single ? describedBy : undefined;

  const errorOf = (field: Field) =>
    missing?.has(field.name) ? fieldErrorMessage(field) : undefined;

  /**
   * Les précisions ouvertes par une option — seulement pour l'option retenue.
   * Sans ce filtre, une précision partagée par plusieurs options (l'arrêt de
   * travail) s'afficherait sous chacune d'elles.
   */
  function subsFor(main: Field, optionValue: string) {
    if (answers[main.name] !== optionValue) return [];
    return subFields.filter(
      (field) => opensUnder(field, optionValue) && isFieldVisible(field, answers),
    );
  }

  function renderField(field: Field) {
    const carriesSubs = field === mainFields[0] && subFields.length > 0 && field.type === "radio";

    return (
      <FieldRenderer
        key={field.name}
        field={field}
        answers={answers}
        setAnswer={setAnswer}
        labelledBy={labelledBy}
        describedBy={inherited}
        error={errorOf(field)}
        renderAfterOption={
          carriesSubs
            ? (optionValue) => {
                const opened = subsFor(field, optionValue);
                if (opened.length === 0) return null;
                const option = field.options.find((o) => o.value === optionValue);
                return (
                  <div
                    role="group"
                    aria-label={`Précisions : ${option?.label ?? ""}`}
                    className="border-border-strong ms-2 flex flex-col gap-6 border-s-2 ps-4 sm:ms-4 sm:ps-6"
                  >
                    {opened.map((sub) => (
                      <FieldRenderer
                        key={sub.name}
                        field={sub}
                        answers={answers}
                        setAnswer={setAnswer}
                        error={errorOf(sub)}
                      />
                    ))}
                  </div>
                );
              }
            : undefined
        }
      />
    );
  }

  return <div className="flex w-full flex-col gap-6 md:gap-8">{mainFields.map(renderField)}</div>;
}
