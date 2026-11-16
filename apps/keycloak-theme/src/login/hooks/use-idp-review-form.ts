import { type FormEvent, type MouseEvent, useEffect, useState } from "react";

import {
  forgetRegistrationReturn,
  REGISTRATION_RETURN,
  rememberRegistrationReturn,
} from "../components/registration-return";
import { TERMS_ACCEPTED_FIELD } from "../components/registration-fields";
import { rememberSubmittedForm, SUBMITTED_FORM } from "../components/submitted-form";
import { useSubmitting } from "./use-submitting";

const MAIN_BUTTON = 0;

interface UseIdpReviewFormOptions {
  isAdresseComplete: boolean;
  hasAcceptedTerms: boolean;
  /** Champ de l'adresse à compléter, s'il en reste un. */
  adresseFirstMissingFieldId: string | undefined;
}

/** État de « Finaliser la création de votre espace ». */
export interface UseIdpReviewFormResult {
  isSubmitBlocked: boolean;
  isSubmitting: boolean;
  isIncomplete: boolean;
  shouldAnnounceIncomplete: boolean;
  submit: (event: FormEvent<HTMLFormElement>) => void;
  /** « Annuler et revenir à l'inscription » : la connexion que Keycloak affiche ensuite y renverra. */
  cancel: (event: MouseEvent<HTMLAnchorElement>) => void;
}

/** Refus d'un envoi incomplet, qui place le focus sur le champ manquant, et garde contre la double soumission. */
export function useIdpReviewForm(options: UseIdpReviewFormOptions): UseIdpReviewFormResult {
  const { isAdresseComplete, hasAcceptedTerms, adresseFirstMissingFieldId } = options;

  const { isSubmitting, startSubmitting } = useSubmitting();
  const [hasIncompleteAttempt, setHasIncompleteAttempt] = useState(false);

  // La marque posée avant FranceConnect, ou copiée par un onglet dupliqué, n'a plus lieu d'être ici.
  useEffect(() => {
    forgetRegistrationReturn();
  }, []);

  const isComplete = isAdresseComplete && hasAcceptedTerms;
  const firstMissingFieldId =
    adresseFirstMissingFieldId ?? (hasAcceptedTerms ? undefined : TERMS_ACCEPTED_FIELD);

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
      forgetRegistrationReturn();
      rememberSubmittedForm(SUBMITTED_FORM.REGISTRATION);
    },
    cancel: (event) => {
      if (isSubmitting) {
        event.preventDefault();
        return;
      }
      const isOpeningElsewhere =
        event.button !== MAIN_BUTTON ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey;
      if (!isOpeningElsewhere) rememberRegistrationReturn(REGISTRATION_RETURN.IDP_REVIEW_CANCELLED);
    },
  };
}
