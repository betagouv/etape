import { type FormEvent, useState } from "react";
import { flushSync } from "react-dom";

import { rememberSubmittedForm, SUBMITTED_FORM } from "../components/submitted-form";
import { useSubmitting } from "./use-submitting";

/** Étapes de l'inscription. */
export const REGISTER_STEP = {
  INFORMATIONS: 1,
  CREDENTIALS: 2,
} as const;

/** Étape de l'inscription. */
export type RegisterStep = (typeof REGISTER_STEP)[keyof typeof REGISTER_STEP];

const FIRST_FIELD_ID_BY_STEP: Record<RegisterStep, string> = {
  [REGISTER_STEP.INFORMATIONS]: "firstName",
  [REGISTER_STEP.CREDENTIALS]: "email",
};

interface UseRegisterFormOptions {
  initialStep: RegisterStep;
  isInformationsComplete: boolean;
  isCredentialsComplete: boolean;
  firstMissingFieldId: Record<RegisterStep, string | undefined>;
  onIncomplete: (fieldId: string) => void;
}

/** État du formulaire d'inscription en deux étapes. */
export interface UseRegisterFormResult {
  step: RegisterStep;
  hasStepChanged: boolean;
  isContinueBlocked: boolean;
  isSubmitBlocked: boolean;
  isSubmitting: boolean;
  isStepIncomplete: boolean;
  shouldAnnounceIncomplete: boolean;
  goBack: () => void;
  submit: (event: FormEvent<HTMLFormElement>) => void;
}

/** Passage d'une étape à l'autre, refus d'une étape incomplète et garde contre la double soumission. */
export function useRegisterForm(options: UseRegisterFormOptions): UseRegisterFormResult {
  const {
    initialStep,
    isInformationsComplete,
    isCredentialsComplete,
    firstMissingFieldId,
    onIncomplete,
  } = options;

  const [step, setStep] = useState(initialStep);
  const [hasStepChanged, setHasStepChanged] = useState(false);
  const { isSubmitting, startSubmitting } = useSubmitting();
  const [hasIncompleteAttempt, setHasIncompleteAttempt] = useState(false);

  const goTo = (nextStep: RegisterStep): void => {
    flushSync(() => {
      setStep(nextStep);
      setHasStepChanged(true);
      setHasIncompleteAttempt(false);
    });
    document.getElementById(FIRST_FIELD_ID_BY_STEP[nextStep])?.focus();
  };

  const signalIncomplete = (): void => {
    setHasIncompleteAttempt(true);
    setHasStepChanged(false);
    const fieldId = firstMissingFieldId[step];
    if (fieldId === undefined) return;
    onIncomplete(fieldId);
    document.getElementById(fieldId)?.focus();
  };

  const isStepComplete: Record<RegisterStep, boolean> = {
    [REGISTER_STEP.INFORMATIONS]: isInformationsComplete,
    [REGISTER_STEP.CREDENTIALS]: isInformationsComplete && isCredentialsComplete,
  };

  // Dérivé pendant le rendu : une étape devenue complète oublie la tentative ratée,
  // pour que l'annonce « incomplet » ne revienne pas si on la vide ensuite.
  if (hasIncompleteAttempt && isStepComplete[step]) setHasIncompleteAttempt(false);

  const isSubmitBlocked = !isStepComplete[REGISTER_STEP.CREDENTIALS] || isSubmitting;

  return {
    step,
    hasStepChanged,
    isContinueBlocked: !isInformationsComplete,
    isSubmitBlocked,
    isSubmitting,
    isStepIncomplete: !isStepComplete[step],
    shouldAnnounceIncomplete: hasIncompleteAttempt && !isStepComplete[step],
    goBack: () => goTo(REGISTER_STEP.INFORMATIONS),
    submit: (event) => {
      if (step === REGISTER_STEP.INFORMATIONS) {
        event.preventDefault();
        if (isInformationsComplete) goTo(REGISTER_STEP.CREDENTIALS);
        else signalIncomplete();
        return;
      }
      if (isSubmitBlocked) {
        event.preventDefault();
        if (!isSubmitting) signalIncomplete();
        return;
      }
      startSubmitting();
      rememberSubmittedForm(SUBMITTED_FORM.REGISTRATION);
    },
  };
}
