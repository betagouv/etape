import { type FormEvent, useState } from "react";

import { isEmailFormatValid } from "../components/email-format";

export const LOGIN_FIELD = {
  USERNAME: "username",
  PASSWORD: "password",
} as const;

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
  checkEmailFormat: () => void;
  submit: (event: FormEvent<HTMLFormElement>) => void;
}

export function useLoginForm(options: UseLoginFormOptions): UseLoginFormResult {
  const { initialUsername, isUsernameHidden, shouldCheckEmailFormat } = options;

  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasEmailFormatError, setHasEmailFormatError] = useState(false);

  const isFilled = (currentUsername: string, currentPassword: string): boolean =>
    (isUsernameHidden || currentUsername.trim() !== "") && currentPassword !== "";

  const isEmailFormatWrong = (value: string): boolean =>
    shouldCheckEmailFormat &&
    !isUsernameHidden &&
    value.trim() !== "" &&
    !isEmailFormatValid(value);

  return {
    username,
    password,
    isSubmittable: isFilled(username, password),
    isSubmitting,
    hasEmailFormatError,
    changeUsername: (value) => {
      setUsername(value);
      if (hasEmailFormatError && !isEmailFormatWrong(value)) setHasEmailFormatError(false);
    },
    changePassword: setPassword,
    checkEmailFormat: () => setHasEmailFormatError(isEmailFormatWrong(username)),
    submit: (event) => {
      const form = event.currentTarget;
      const data = new FormData(form);
      const currentUsername = String(data.get(LOGIN_FIELD.USERNAME) ?? "");
      const currentPassword = String(data.get(LOGIN_FIELD.PASSWORD) ?? "");

      if (isSubmitting || !isFilled(currentUsername, currentPassword)) {
        event.preventDefault();
        return;
      }
      if (isEmailFormatWrong(currentUsername)) {
        event.preventDefault();
        setHasEmailFormatError(true);
        form.querySelector<HTMLInputElement>(`[name="${LOGIN_FIELD.USERNAME}"]`)?.focus();
        return;
      }
      setIsSubmitting(true);
    },
  };
}
