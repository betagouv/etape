import { type AnimationEvent, type FormEvent, useEffect, useState } from "react";

import { isEmailFormatValid } from "../components/email-format";
import {
  forgetSubmittedForm,
  rememberSubmittedForm,
  SUBMITTED_FORM,
} from "../components/submitted-form";

export const LOGIN_FIELD = {
  USERNAME: "username",
  PASSWORD: "password",
} as const;

export type LoginField = (typeof LOGIN_FIELD)[keyof typeof LOGIN_FIELD];

const AUTOFILL_ANIMATION = "etape-autofill";

interface UseLoginFormOptions {
  initialUsername: string;
  isUsernameHidden: boolean;
  shouldCheckEmailFormat: boolean;
}

export interface UseLoginFormResult {
  username: string;
  password: string;
  isSubmittable: boolean;
  isSubmitting: boolean;
  hasEmailFormatError: boolean;
  changeUsername: (value: string) => void;
  changePassword: (value: string) => void;
  detectAutofill: (field: LoginField) => (event: AnimationEvent<HTMLInputElement>) => void;
  checkEmailFormat: () => void;
  submit: (event: FormEvent<HTMLFormElement>) => void;
}

const NO_AUTOFILL: Record<LoginField, boolean> = {
  [LOGIN_FIELD.USERNAME]: false,
  [LOGIN_FIELD.PASSWORD]: false,
};

export function useLoginForm(options: UseLoginFormOptions): UseLoginFormResult {
  const { initialUsername, isUsernameHidden, shouldCheckEmailFormat } = options;

  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState("");
  const [autofilled, setAutofilled] = useState(NO_AUTOFILL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasEmailFormatError, setHasEmailFormatError] = useState(false);

  useEffect(() => {
    forgetSubmittedForm();
  }, []);

  const isFilled = (hasUsername: boolean, hasPassword: boolean): boolean =>
    (isUsernameHidden || hasUsername) && hasPassword;

  const isEmailFormatWrong = (value: string): boolean =>
    shouldCheckEmailFormat &&
    !isUsernameHidden &&
    value.trim() !== "" &&
    !isEmailFormatValid(value);

  const clearAutofill = (field: LoginField): void =>
    setAutofilled((current) => (current[field] ? { ...current, [field]: false } : current));

  return {
    username,
    password,
    isSubmittable: isFilled(
      autofilled[LOGIN_FIELD.USERNAME] || username.trim() !== "",
      autofilled[LOGIN_FIELD.PASSWORD] || password !== "",
    ),
    isSubmitting,
    hasEmailFormatError,
    changeUsername: (value) => {
      clearAutofill(LOGIN_FIELD.USERNAME);
      setUsername(value);
      if (hasEmailFormatError && !isEmailFormatWrong(value)) setHasEmailFormatError(false);
    },
    changePassword: (value) => {
      clearAutofill(LOGIN_FIELD.PASSWORD);
      setPassword(value);
    },
    detectAutofill: (field) => (event) => {
      if (event.animationName === AUTOFILL_ANIMATION) {
        setAutofilled((current) => ({ ...current, [field]: true }));
      }
    },
    checkEmailFormat: () => setHasEmailFormatError(isEmailFormatWrong(username)),
    submit: (event) => {
      const form = event.currentTarget;
      const data = new FormData(form);
      const currentUsername = String(data.get(LOGIN_FIELD.USERNAME) ?? "");
      const currentPassword = String(data.get(LOGIN_FIELD.PASSWORD) ?? "");

      if (isSubmitting || !isFilled(currentUsername.trim() !== "", currentPassword !== "")) {
        event.preventDefault();
        return;
      }
      if (isEmailFormatWrong(currentUsername)) {
        event.preventDefault();
        setHasEmailFormatError(true);
        form.querySelector<HTMLInputElement>(`[name="${LOGIN_FIELD.USERNAME}"]`)?.focus();
        return;
      }
      rememberSubmittedForm(SUBMITTED_FORM.LOGIN);
      setIsSubmitting(true);
    },
  };
}
