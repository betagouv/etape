import type { Answers } from "@/questionnaire/domain/types";

import { buildRecap } from "../domain/recap";
import { PencilIcon } from "./icons";

interface AnswersRecapProps {
  answers: Answers;
  /** Revenir modifier la réponse d'une question. */
  onEdit: (questionId: string) => void;
}

/** Récapitulatif des réponses (Figma node 3210:23408) : tableau question / réponse. */
export function AnswersRecap({ answers, onEdit }: AnswersRecapProps) {
  const entries = buildRecap(answers);

  return (
    <section aria-labelledby="recap-title" className="flex w-full flex-col gap-6">
      <h2 id="recap-title" className="text-foreground text-2xl leading-8 font-bold">
        Récapitulatif de vos réponses
      </h2>

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-border border-b">
            <th className="text-muted-foreground py-2 pr-4 text-sm font-semibold">Question</th>
            <th className="text-muted-foreground py-2 pr-4 text-sm font-semibold">Réponse</th>
            <th className="w-10">
              <span className="sr-only">Modifier</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.questionId} className="border-border border-b align-top">
              <td className="text-content-secondary py-3 pr-4 text-sm leading-5">
                {entry.question}
              </td>
              <td className="text-foreground py-3 pr-4 text-sm leading-5 font-semibold">
                {entry.answer}
              </td>
              <td className="py-3">
                <button
                  type="button"
                  onClick={() => onEdit(entry.questionId)}
                  aria-label={`Modifier : ${entry.question}`}
                  className="text-muted-foreground hover:text-primary flex cursor-pointer items-center justify-center p-1"
                >
                  <PencilIcon className="size-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
