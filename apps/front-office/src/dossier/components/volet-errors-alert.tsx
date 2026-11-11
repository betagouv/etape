import type { Ref } from "react";
import { Alert, AlertDescription, AlertTitle } from "@etape/ui/components/alert";
import { CircleAlertIcon } from "lucide-react";

import { formatVoletErrorsTitle, type VoletError } from "../domain/volet-errors";

export interface VoletErrorsAlertProps {
  errors: VoletError[];
  /** Pour recevoir le focus à la soumission : c'est lui qui annonce les erreurs, pas les champs. */
  ref?: Ref<HTMLDivElement>;
}

/** Liste les erreurs du volet, chacune menant à son champ. */
export function VoletErrorsAlert({ errors, ref }: VoletErrorsAlertProps) {
  if (errors.length === 0) return null;

  return (
    <Alert ref={ref} tabIndex={-1} variant="destructive-subdued">
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
