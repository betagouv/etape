import type { Answers } from "@/questionnaire/domain/types";

import { buildRecap } from "../domain/recap";
import { PencilIcon } from "./icons";

interface AnswersRecapProps {
  answers: Answers;
  onEdit: (questionId: string) => void;
}

export function AnswersRecap({ answers, onEdit }: AnswersRecapProps) {
  const entries = buildRecap(answers);

  return (
    <section aria-labelledby="recap-title" className="flex w-full flex-col gap-6">
      <h2 id="recap-title" className="text-foreground text-2xl leading-8 font-bold">
        Récapitulatif de vos réponses
      </h2>

      <ul className="flex flex-col md:hidden">
        {entries.map((entry) => (
          <li
            key={entry.questionId}
            className="border-border flex items-center gap-2 border-b py-3 last:border-b-0"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-foreground text-sm leading-5 font-bold">{entry.question}</p>
              <p className="text-foreground text-sm leading-5">{entry.answer}</p>
            </div>
            <button
              type="button"
              onClick={() => onEdit(entry.questionId)}
              aria-label={`Modifier : ${entry.question}`}
              className="text-content-accent hover:bg-secondary flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-sm"
            >
              <PencilIcon className="size-6" />
            </button>
          </li>
        ))}
      </ul>

      <table className="hidden w-full border-collapse text-left md:table">
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
