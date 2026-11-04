import { useEffect, useRef, type RefObject } from "react";

/**
 * Focus sur le résumé d'erreurs à chaque soumission, pour qu'il annonce les erreurs :
 * `FieldError` n'a pas de rôle d'alerte, et `shouldFocusError` est désactivé pour cela.
 */
export function useErrorsAlertFocus(submitCount: number): RefObject<HTMLDivElement | null> {
  const errorsAlertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (submitCount > 0) errorsAlertRef.current?.focus();
  }, [submitCount]);

  return errorsAlertRef;
}
