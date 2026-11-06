import { type FormEvent, useState } from "react";

import { getPasswordRules } from "../components/password-rules";

const CANCEL_FIELD = "cancel-aia";

export interface UseUpdatePasswordFormResult {
  password: string;
  isSubmitBlocked: boolean;
  isSubmitting: boolean;
  changePassword: (value: string) => void;
  submit: (event: FormEvent<HTMLFormElement>) => void;
}

export function useUpdatePasswordForm(): UseUpdatePasswordFormResult {
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPasswordValid = getPasswordRules(password).every((rule) => rule.isSatisfied);
  const isSubmitBlocked = !isPasswordValid || isSubmitting;

  return {
    password,
    isSubmitBlocked,
    isSubmitting,
    changePassword: setPassword,
    submit: (event) => {
      const submitter = (event.nativeEvent as SubmitEvent).submitter;
      if (submitter?.getAttribute("name") === CANCEL_FIELD) return;
      if (isSubmitBlocked) {
        event.preventDefault();
        return;
      }
      setIsSubmitting(true);
    },
  };
}
