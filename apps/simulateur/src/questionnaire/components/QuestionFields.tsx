"use client";

import { Fragment } from "react";
import { InsetPanel } from "@etape/ui/components/inset-panel";
import { Separator } from "@etape/ui/components/separator";

import { isFieldVisible, opensUnder } from "../domain/conditions";
import type { Answers, AnswerValue, Field, Question } from "../domain/types";
import { FieldRenderer } from "./FieldRenderer";
import { InlineFieldErrorProvider } from "./fields/FieldError";

interface QuestionFieldsProps {
  question: Question;
  answers: Answers;
  setAnswer: (name: string, value: AnswerValue) => void;
  /** Id du titre de la question, prêté au champ quand il est seul sur l'écran. */
  titleId: string;
  describedBy?: string;
  /** Message d'erreur par `name` de champ. Vide tant que rien n'a été tenté. */
  errors?: ReadonlyMap<string, string>;
  /**
   * Afficher les messages SOUS les champs. Faux quand l'écran n'a qu'un champ :
   * son message tient alors en bas de l'écran, sans le répéter.
   */
  inlineErrors?: boolean;
}

/**
 * Les champs d'une question.
 *
 * Une précision (`sub`) s'ouvre SOUS l'option qui la déclenche, dans le même
 * écran : le lien entre le choix et ce qu'il ouvre reste visible, plutôt que de
 * renvoyer l'utilisateur en bas de page. Les champs de premier niveau se
 * suivent normalement ; ceux marqués `inset` se rangent dans un encart en
 * retrait, sous le champ visible qui les précède — celui qui les a ouverts.
 */
export function QuestionFields({
  question,
  answers,
  setAnswer,
  titleId,
  describedBy,
  errors,
  inlineErrors = true,
}: QuestionFieldsProps) {
  const mainFields = question.fields.filter((field) => field.sub === undefined);
  const subFields = question.fields.filter((field) => field.sub !== undefined);

  // Le titre ne peut nommer qu'un champ : dès qu'il y en a plusieurs, chacun
  // porte son propre libellé.
  const single = question.fields.length === 1;
  const labelledBy = single ? titleId : undefined;
  const inherited = single ? describedBy : undefined;

  const errorOf = (field: Field) => errors?.get(field.name);

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
                  // Chaque précision s'ouvre sous un filet, dans la carte de
                  // l'option : le lien entre le choix et ce qu'il ouvre se lit
                  // sans retrait, la carte faisant déjà le regroupement.
                  <div
                    role="group"
                    aria-label={`Précisions : ${option?.label ?? ""}`}
                    className="flex flex-col gap-3"
                  >
                    {opened.map((sub) => (
                      <Fragment key={sub.name}>
                        <Separator />
                        <FieldRenderer
                          field={sub}
                          answers={answers}
                          setAnswer={setAnswer}
                          error={errorOf(sub)}
                        />
                      </Fragment>
                    ))}
                  </div>
                );
              }
            : undefined
        }
      />
    );
  }

  return (
    <InlineFieldErrorProvider value={inlineErrors}>
      <div className="flex w-full flex-col gap-8">
        {groupInsets(mainFields.filter((field) => isFieldVisible(field, answers))).map(
          ({ anchor, insets }) =>
            insets.length === 0 ? (
              renderField(anchor)
            ) : (
              <div key={anchor.name} className="flex flex-col gap-2">
                {renderField(anchor)}
                <InsetPanel>{insets.map(renderField)}</InsetPanel>
              </div>
            ),
        )}
      </div>
    </InlineFieldErrorProvider>
  );
}

/** Un champ et l'encart des champs `inset` qu'il a ouverts. */
interface InsetGroup {
  anchor: Field;
  insets: Field[];
}

/**
 * Range chaque champ `inset` sous le champ visible qui le précède. Le
 * regroupement se fait sur les champs VISIBLES : la région de travail s'ouvre
 * sous la case « Je travaille dans une autre région » quand on réside en France,
 * sous le choix « Hors de France », avec « Travaillez-vous en France ? », quand
 * on réside à l'étranger.
 */
function groupInsets(fields: Field[]): InsetGroup[] {
  const groups: InsetGroup[] = [];
  for (const field of fields) {
    const previous = groups.at(-1);
    if (field.inset && previous) previous.insets.push(field);
    else groups.push({ anchor: field, insets: [] });
  }
  return groups;
}
