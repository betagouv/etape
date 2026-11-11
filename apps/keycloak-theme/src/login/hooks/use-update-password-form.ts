import { type FormEvent, useEffect, useRef, useState } from "react";

import { getPasswordRules } from "../components/password-rules";
import { useSubmitting } from "./use-submitting";

export const CANCEL_FIELD = "cancel-aia";
export const PASSWORD_NEW_FIELD = "password-new";

const ANNOUNCE_DELAY_MS = 100;

export interface UseUpdatePasswordFormResult {
  password: string;
  isSubmitBlocked: boolean;
  isSubmitting: boolean;
  shouldShowRules: boolean;
  shouldAnnounceInvalid: boolean;
  changePassword: (value: string) => void;
  submit: (event: FormEvent<HTMLFormElement>) => void;
}

const isPasswordValid = (value: string): boolean =>
  getPasswordRules(value).every((rule) => rule.isSatisfied);

export function useUpdatePasswordForm(): UseUpdatePasswordFormResult {
  const [password, setPassword] = useState("");
  const [hasInvalidAttempt, setHasInvalidAttempt] = useState(false);
  const [shouldAnnounceInvalid, setShouldAnnounceInvalid] = useState(false);
  const announceTimeout = useRef<number | undefined>(undefined);
  const { isSubmitting, startSubmitting } = useSubmitting();

  useEffect(() => () => window.clearTimeout(announceTimeout.current), []);

  const announceInvalid = (): void => {
    setShouldAnnounceInvalid(false);
    window.clearTimeout(announceTimeout.current);
    announceTimeout.current = window.setTimeout(
      () => setShouldAnnounceInvalid(true),
      ANNOUNCE_DELAY_MS,
    );
  };

  const isCurrentPasswordValid = isPasswordValid(password);

  return {
    password,
    isSubmitBlocked: !isCurrentPasswordValid || isSubmitting,
    isSubmitting,
    shouldShowRules: password !== "" || hasInvalidAttempt,
    shouldAnnounceInvalid,
    changePassword: (value) => {
      setPassword(value);
      if (isPasswordValid(value)) {
        window.clearTimeout(announceTimeout.current);
        setShouldAnnounceInvalid(false);
      }
    },
    submit: (event) => {
      const form = event.currentTarget;
      const submitter = (event.nativeEvent as SubmitEvent).submitter;
      if (submitter?.getAttribute("name") === CANCEL_FIELD) return;
      if (isSubmitting) {
        event.preventDefault();
        return;
      }
      if (!isCurrentPasswordValid) {
        event.preventDefault();
        setHasInvalidAttempt(true);
        announceInvalid();
        form.querySelector<HTMLInputElement>(`[name="${PASSWORD_NEW_FIELD}"]`)?.focus();
        return;
      }
      startSubmitting();
    },
  };
}
