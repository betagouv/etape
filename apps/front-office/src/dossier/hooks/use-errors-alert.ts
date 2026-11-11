import { useEffect, useRef, useState, type RefObject } from "react";

import type { VoletError } from "../domain/volet-errors";

/** Ce que renvoie `useErrorsAlert` : la référence du résumé d'erreurs et les erreurs à y afficher. */
export interface UseErrorsAlertResult {
  ref: RefObject<HTMLDivElement | null>;
  /** Les erreurs du dernier envoi, vides avant le premier. */
  errors: VoletError[];
}

interface SubmittedErrors {
  submitCount: number;
  errors: VoletError[];
}

/**
 * Le résumé d'erreurs ne change qu'à l'envoi : s'il suivait chaque champ quitté, il
 * décalerait la page sous le pointeur, et le clic sur « Étape suivante » tomberait à côté.
 * Il prend alors le focus pour annoncer les erreurs : `FieldError` n'a pas de rôle d'alerte.
 */
export function useErrorsAlert(
  submitCount: number,
  voletErrors: VoletError[],
): UseErrorsAlertResult {
  const ref = useRef<HTMLDivElement>(null);
  const [submitted, setSubmitted] = useState<SubmittedErrors>({ submitCount: 0, errors: [] });

  // react-hook-form compte l'envoi et pose ses erreurs dans le même rendu.
  if (submitted.submitCount !== submitCount) setSubmitted({ submitCount, errors: voletErrors });

  useEffect(() => {
    if (submitCount > 0) ref.current?.focus();
  }, [submitCount]);

  return { ref, errors: submitted.errors };
}
