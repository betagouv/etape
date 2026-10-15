import { PencilIcon } from "lucide-react";

import { Button } from "@etape/ui/components/button";
import { Card, CardContent } from "@etape/ui/components/card";

import type { RecapEntry } from "../domain/recap";

interface AnswersRecapProps {
  entries: RecapEntry[];
  onEdit: (questionId: string) => void;
}

export function AnswersRecap({ entries, onEdit }: AnswersRecapProps) {
  return (
    <section aria-labelledby="recap-title" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="recap-title" className="font-heading text-heading-sm text-foreground">
          Vos réponses
        </h2>
        <p className="text-muted-foreground text-body">
          Modifiez une réponse&nbsp;: les résultats se recalculent immédiatement.
        </p>
      </div>

      <Card variant="outline">
        <CardContent>
          <ul className="flex flex-col gap-4">
            {entries.map((entry) => (
              <li
                key={`${entry.questionId}-${entry.fieldName}`}
                className="border-border flex items-center gap-4 border-b pb-4 last:border-b-0 last:pb-0"
              >
                <div className="text-body-sm flex min-w-0 flex-1 flex-col gap-1 md:flex-row md:items-center md:justify-between md:gap-4">
                  <p className="text-muted-foreground">{entry.question}</p>
                  <p className="text-foreground font-medium md:text-right">{entry.answer}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-responsive-sm"
                  onClick={() => onEdit(entry.questionId)}
                  aria-label={`Modifier : ${entry.question}`}
                >
                  <PencilIcon aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
