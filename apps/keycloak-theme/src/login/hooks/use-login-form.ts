import {
  type AnimationEvent,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
  useEffect,
  useState,
} from "react";

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
const PRESSED_ACTION_SELECTOR = "a:active, button:active";

interface UseLoginFormOptions {
  initialUsername: string;
  isUsernameHidden: boolean;
  shouldCheckEmailFormat: boolean;
}

export interface UseLoginFormResult {
  isSubmittable: boolean;
  isSubmitting: boolean;
  hasEmailFormatError: boolean;
  shouldAnnounceIncomplete: boolean;
  changeUsername: (event: ChangeEvent<HTMLInputElement>) => void;
  changePassword: (event: ChangeEvent<HTMLInputElement>) => void;
  detectAutofill: (field: LoginField) => (event: AnimationEvent<HTMLInputElement>) => void;
  checkEmailFormat: (event: FocusEvent<HTMLInputElement>) => void;
  submit: (event: FormEvent<HTMLFormElement>) => void;
}

export function useLoginForm(options: UseLoginFormOptions): UseLoginFormResult {
  const { initialUsername, isUsernameHidden, shouldCheckEmailFormat } = options;

  const [filled, setFilled] = useState<Record<LoginField, boolean>>({
    [LOGIN_FIELD.USERNAME]: initialUsername.trim() !== "",
    [LOGIN_FIELD.PASSWORD]: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasEmailFormatError, setHasEmailFormatError] = useState(false);
  const [hasIncompleteAttempt, setHasIncompleteAttempt] = useState(false);

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

  const markFilled = (field: LoginField, isFieldFilled: boolean): void =>
    setFilled((current) =>
      current[field] === isFieldFilled ? current : { ...current, [field]: isFieldFilled },
    );

  const focusField = (form: HTMLFormElement, field: LoginField): void =>
    form.querySelector<HTMLInputElement>(`[name="${field}"]`)?.focus();

  const isSubmittable = isFilled(filled[LOGIN_FIELD.USERNAME], filled[LOGIN_FIELD.PASSWORD]);

  return {
    isSubmittable,
    isSubmitting,
    hasEmailFormatError,
    shouldAnnounceIncomplete: hasIncompleteAttempt && !isSubmittable,
    changeUsername: (event) => {
      const { value } = event.currentTarget;
      markFilled(LOGIN_FIELD.USERNAME, value.trim() !== "");
      if (hasEmailFormatError && !isEmailFormatWrong(value)) setHasEmailFormatError(false);
    },
    changePassword: (event) => markFilled(LOGIN_FIELD.PASSWORD, event.currentTarget.value !== ""),
    detectAutofill: (field) => (event) => {
      if (event.animationName === AUTOFILL_ANIMATION) markFilled(field, true);
    },
    checkEmailFormat: (event) => {
      if (document.querySelector(PRESSED_ACTION_SELECTOR) !== null) return;
      setHasEmailFormatError(isEmailFormatWrong(event.currentTarget.value));
    },
    submit: (event) => {
      const form = event.currentTarget;
      const data = new FormData(form);
      const currentUsername = String(data.get(LOGIN_FIELD.USERNAME) ?? "");
      const currentPassword = String(data.get(LOGIN_FIELD.PASSWORD) ?? "");

      if (isSubmitting) {
        event.preventDefault();
        return;
      }
      const hasUsername = currentUsername.trim() !== "";
      if (!isFilled(hasUsername, currentPassword !== "")) {
        event.preventDefault();
        setHasIncompleteAttempt(true);
        focusField(
          form,
          isUsernameHidden || hasUsername ? LOGIN_FIELD.PASSWORD : LOGIN_FIELD.USERNAME,
        );
        return;
      }
      if (isEmailFormatWrong(currentUsername)) {
        event.preventDefault();
        setHasEmailFormatError(true);
        focusField(form, LOGIN_FIELD.USERNAME);
        return;
      }
      rememberSubmittedForm(SUBMITTED_FORM.LOGIN);
      setIsSubmitting(true);
    },
  };
}
