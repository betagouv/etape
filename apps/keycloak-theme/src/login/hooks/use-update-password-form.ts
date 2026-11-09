import { type FormEvent, useState } from "react";

import { getPasswordRules } from "../components/password-rules";
import { useSubmitting } from "./use-submitting";

export const CANCEL_FIELD = "cancel-aia";
export const PASSWORD_NEW_FIELD = "password-new";

export interface UseUpdatePasswordFormResult {
  password: string;
  isSubmitBlocked: boolean;
  isSubmitting: boolean;
  shouldShowRules: boolean;
  shouldAnnounceInvalid: boolean;
  changePassword: (value: string) => void;
  submit: (event: FormEvent<HTMLFormElement>) => void;
}

export function useUpdatePasswordForm(): UseUpdatePasswordFormResult {
  const [password, setPassword] = useState("");
  const [hasInvalidAttempt, setHasInvalidAttempt] = useState(false);
  const { isSubmitting, startSubmitting } = useSubmitting();

  const isPasswordValid = getPasswordRules(password).every((rule) => rule.isSatisfied);
  const isSubmitBlocked = !isPasswordValid || isSubmitting;

  return {
    password,
    isSubmitBlocked,
    isSubmitting,
    shouldShowRules: password !== "" || hasInvalidAttempt,
    shouldAnnounceInvalid: hasInvalidAttempt && !isPasswordValid,
    changePassword: setPassword,
    submit: (event) => {
      const form = event.currentTarget;
      const submitter = (event.nativeEvent as SubmitEvent).submitter;
      if (submitter?.getAttribute("name") === CANCEL_FIELD) return;
      if (isSubmitting) {
        event.preventDefault();
        return;
      }
      if (!isPasswordValid) {
        event.preventDefault();
        setHasInvalidAttempt(true);
        form.querySelector<HTMLInputElement>(`[name="${PASSWORD_NEW_FIELD}"]`)?.focus();
        return;
      }
      startSubmitting();
    },
  };
}
