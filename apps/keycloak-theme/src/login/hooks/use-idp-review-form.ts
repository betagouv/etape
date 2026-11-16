import { type FormEvent, useState } from "react";

import { rememberSubmittedForm, SUBMITTED_FORM } from "../components/submitted-form";
import { useSubmitting } from "./use-submitting";

interface UseIdpReviewFormOptions {
  isAdresseComplete: boolean;
  areTermsAccepted: boolean;
  /** Premier champ à compléter, dans l'ordre de la page. */
  firstMissingFieldId: string | undefined;
}

/** État de « Finaliser la création de votre espace ». */
export interface UseIdpReviewFormResult {
  isSubmitBlocked: boolean;
  isSubmitting: boolean;
  isIncomplete: boolean;
  shouldAnnounceIncomplete: boolean;
  submit: (event: FormEvent<HTMLFormElement>) => void;
}

/** Refus d'un envoi incomplet, qui place le focus sur le champ manquant, et garde contre la double soumission. */
export function useIdpReviewForm(options: UseIdpReviewFormOptions): UseIdpReviewFormResult {
  const { isAdresseComplete, areTermsAccepted, firstMissingFieldId } = options;

  const { isSubmitting, startSubmitting } = useSubmitting();
  const [hasIncompleteAttempt, setHasIncompleteAttempt] = useState(false);

  const isComplete = isAdresseComplete && areTermsAccepted;

  // Dérivé pendant le rendu : un formulaire redevenu complet oublie la tentative ratée.
  if (hasIncompleteAttempt && isComplete) setHasIncompleteAttempt(false);

  const isSubmitBlocked = !isComplete || isSubmitting;

  return {
    isSubmitBlocked,
    isSubmitting,
    isIncomplete: !isComplete,
    shouldAnnounceIncomplete: hasIncompleteAttempt && !isComplete,
    submit: (event) => {
      if (isSubmitBlocked) {
        event.preventDefault();
        if (isSubmitting) return;
        setHasIncompleteAttempt(true);
        if (firstMissingFieldId !== undefined)
          document.getElementById(firstMissingFieldId)?.focus();
        return;
      }
      startSubmitting();
      rememberSubmittedForm(SUBMITTED_FORM.REGISTRATION);
    },
  };
}
