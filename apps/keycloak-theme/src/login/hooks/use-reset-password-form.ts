import { type FormEvent, useState } from "react";

import { isEmailFormatValid } from "../components/email-format";

export const RESET_PASSWORD_FIELD = {
  USERNAME: "username",
} as const;

interface UseResetPasswordFormOptions {
  initialUsername: string;
  shouldCheckEmailFormat: boolean;
}

export interface UseResetPasswordFormResult {
  username: string;
  hasEmailFormatError: boolean;
  changeUsername: (value: string) => void;
  checkEmailFormat: () => void;
  submit: (event: FormEvent<HTMLFormElement>) => void;
}

/** Une adresse sans « @ » mènerait à « Consultez votre boîte e-mail » sans qu'aucun e-mail ne parte. */
export function useResetPasswordForm(
  options: UseResetPasswordFormOptions,
): UseResetPasswordFormResult {
  const { initialUsername, shouldCheckEmailFormat } = options;

  const [username, setUsername] = useState(initialUsername);
  const [hasEmailFormatError, setHasEmailFormatError] = useState(false);

  const isEmailFormatWrong = (value: string): boolean =>
    shouldCheckEmailFormat && value.trim() !== "" && !isEmailFormatValid(value);

  return {
    username,
    hasEmailFormatError,
    changeUsername: (value) => {
      setUsername(value);
      if (hasEmailFormatError && !isEmailFormatWrong(value)) setHasEmailFormatError(false);
    },
    checkEmailFormat: () => setHasEmailFormatError(isEmailFormatWrong(username)),
    submit: (event) => {
      const form = event.currentTarget;
      const currentUsername = String(new FormData(form).get(RESET_PASSWORD_FIELD.USERNAME) ?? "");
      if (!isEmailFormatWrong(currentUsername)) return;
      event.preventDefault();
      setHasEmailFormatError(true);
      form.querySelector<HTMLInputElement>(`[name="${RESET_PASSWORD_FIELD.USERNAME}"]`)?.focus();
    },
  };
}
