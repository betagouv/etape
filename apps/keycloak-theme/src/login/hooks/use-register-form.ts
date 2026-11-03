import { type FormEvent, useState } from "react";
import { flushSync } from "react-dom";

import { rememberSubmittedForm, SUBMITTED_FORM } from "../components/submitted-form";

export const REGISTER_STEP = {
  INFORMATIONS: 1,
  CREDENTIALS: 2,
} as const;

export type RegisterStep = (typeof REGISTER_STEP)[keyof typeof REGISTER_STEP];

const FIRST_FIELD_ID_BY_STEP: Record<RegisterStep, string> = {
  [REGISTER_STEP.INFORMATIONS]: "firstName",
  [REGISTER_STEP.CREDENTIALS]: "email",
};

interface UseRegisterFormOptions {
  initialStep: RegisterStep;
  isInformationsComplete: boolean;
  isCredentialsComplete: boolean;
}

export interface UseRegisterFormResult {
  step: RegisterStep;
  hasStepChanged: boolean;
  isContinueBlocked: boolean;
  isSubmitBlocked: boolean;
  isSubmitting: boolean;
  goBack: () => void;
  submit: (event: FormEvent<HTMLFormElement>) => void;
}

export function useRegisterForm(options: UseRegisterFormOptions): UseRegisterFormResult {
  const { initialStep, isInformationsComplete, isCredentialsComplete } = options;

  const [step, setStep] = useState(initialStep);
  const [hasStepChanged, setHasStepChanged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goTo = (nextStep: RegisterStep): void => {
    flushSync(() => {
      setStep(nextStep);
      setHasStepChanged(true);
    });
    document.getElementById(FIRST_FIELD_ID_BY_STEP[nextStep])?.focus();
  };

  const isSubmitBlocked = !isInformationsComplete || !isCredentialsComplete || isSubmitting;

  return {
    step,
    hasStepChanged,
    isContinueBlocked: !isInformationsComplete,
    isSubmitBlocked,
    isSubmitting,
    goBack: () => goTo(REGISTER_STEP.INFORMATIONS),
    submit: (event) => {
      if (step === REGISTER_STEP.INFORMATIONS) {
        event.preventDefault();
        if (isInformationsComplete) goTo(REGISTER_STEP.CREDENTIALS);
        return;
      }
      if (isSubmitBlocked) {
        event.preventDefault();
        return;
      }
      setIsSubmitting(true);
      rememberSubmittedForm(SUBMITTED_FORM.REGISTRATION);
    },
  };
}
