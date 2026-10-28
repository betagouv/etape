import { Alert, AlertDescription, AlertTitle } from "@etape/ui/components/alert";
import { CircleAlertIcon } from "lucide-react";

import type { VoletError } from "../domain/types";
import { formatVoletErrorsTitle } from "../domain/volet-errors";

export interface VoletErrorsAlertProps {
  errors: VoletError[];
}

/** Liste les erreurs du volet, chacune menant à son champ. */
export function VoletErrorsAlert({ errors }: VoletErrorsAlertProps) {
  if (errors.length === 0) return null;

  return (
    <Alert variant="destructive-subdued">
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle>{formatVoletErrorsTitle(errors.length)}</AlertTitle>
      <AlertDescription>
        <ul className="list-disc ps-5">
          {errors.map((error) => (
            <li key={error.fieldId}>
              <a href={`#${error.fieldId}`}>{error.message}</a>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
