import { cn } from "@etape/ui/lib/utils";
import type { FormAction, FormFieldState } from "keycloakify/login/lib/useUserProfileForm";
import { Check, X } from "lucide-react";
import type { ChangeEvent, ReactNode } from "react";

import type { I18n } from "../i18n";
import { Field, FieldError, PasswordInput, TextInput } from "./form";
import {
  getPasswordRules,
  PASSWORD_MIN_LENGTH,
  PASSWORD_RULE_MESSAGE_KEY,
  type PasswordRuleMessageKey,
} from "./password-rules";

export const PASSWORD_RULES_ID = "password-rules";

/** Largeurs des critères dans la maquette : trois sur la première ligne, deux sur la seconde. */
const RULE_WIDTH: Record<PasswordRuleMessageKey, string> = {
  [PASSWORD_RULE_MESSAGE_KEY.LENGTH]: "w-40",
  [PASSWORD_RULE_MESSAGE_KEY.UPPER]: "w-45",
  [PASSWORD_RULE_MESSAGE_KEY.LOWER]: "w-45",
  [PASSWORD_RULE_MESSAGE_KEY.DIGIT]: "w-40",
  [PASSWORD_RULE_MESSAGE_KEY.SPECIAL]: "",
};

export const USER_PROFILE_ATTRIBUTE = {
  EMAIL: "email",
  FIRST_NAME: "firstName",
  LAST_NAME: "lastName",
  LOCALE: "locale",
  PASSWORD: "password",
  PASSWORD_CONFIRM: "password-confirm",
} as const;

export function UserProfileField(props: {
  fieldState: FormFieldState;
  dispatchFormAction: (action: FormAction) => void;
  i18n: I18n;
  hint?: ReactNode;
  addon?: ReactNode;
  autoFocus?: boolean;
  onFocus?: () => void;
}) {
  const { fieldState, dispatchFormAction, i18n, hint, addon, autoFocus, onFocus } = props;
  const { attribute, displayableErrors, valueOrValues } = fieldState;
  const { advancedMsg, advancedMsgStr } = i18n;

  const value = typeof valueOrValues === "string" ? valueOrValues : (valueOrValues[0] ?? "");
  const isInvalid = displayableErrors.length !== 0;
  const isPassword =
    attribute.name === USER_PROFILE_ATTRIBUTE.PASSWORD ||
    attribute.name === USER_PROFILE_ATTRIBUTE.PASSWORD_CONFIRM;

  const onChange = (nextValue: string) =>
    dispatchFormAction({ action: "update", name: attribute.name, valueOrValues: nextValue });

  const onBlur = () =>
    dispatchFormAction({ action: "focus lost", name: attribute.name, fieldIndex: undefined });

  const commonProps = {
    id: attribute.name,
    name: attribute.name,
    value,
    disabled: attribute.readOnly,
    autoComplete: attribute.autocomplete,
    placeholder:
      attribute.annotations.inputTypePlaceholder === undefined
        ? undefined
        : advancedMsgStr(attribute.annotations.inputTypePlaceholder),
    onChange: (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value),
    onBlur,
    onFocus,
    autoFocus,
    invalid: isInvalid,
    "aria-required": attribute.required,
    "aria-describedby": joinIds(
      isInvalid ? `input-error-${attribute.name}` : undefined,
      hint !== undefined ? `${attribute.name}-hint` : undefined,
      addon !== undefined ? PASSWORD_RULES_ID : undefined,
    ),
  };

  return (
    <Field
      id={attribute.name}
      label={advancedMsg(attribute.displayName ?? attribute.name)}
      required={attribute.required}
      hint={hint}
      error={
        isInvalid ? (
          <FieldError
            id={`input-error-${attribute.name}`}
            message={displayableErrors[0]?.errorMessageStr ?? ""}
          />
        ) : undefined
      }
    >
      {isPassword ? (
        <PasswordInput {...commonProps} i18n={i18n} />
      ) : (
        <TextInput
          {...commonProps}
          type="text"
          inputMode={attribute.name === USER_PROFILE_ATTRIBUTE.EMAIL ? "email" : undefined}
        />
      )}
      {addon}
    </Field>
  );
}

export function PasswordRules(props: { value: string; i18n: I18n; minLength?: number }) {
  const { value, i18n, minLength = PASSWORD_MIN_LENGTH } = props;
  const { msgStr } = i18n;

  const rules = getPasswordRules(value, minLength);

  return (
    <div id={PASSWORD_RULES_ID} className="bg-secondary flex flex-col gap-2 rounded-md px-3 py-2">
      <p className="text-body-sm text-foreground">{msgStr("etapePasswordRulesTitle")}</p>
      <ul className="flex flex-wrap gap-2">
        {rules.map(({ messageKey, isSatisfied }) => (
          <li
            key={messageKey}
            className={cn("text-body-sm flex items-center gap-1.5", RULE_WIDTH[messageKey])}
          >
            <span
              aria-hidden
              className={cn(
                "flex shrink-0 rounded-full p-1",
                isSatisfied
                  ? "bg-success text-success-foreground"
                  : "bg-secondary-selected text-muted-foreground",
              )}
            >
              {isSatisfied ? <Check className="size-2.5" /> : <X className="size-2.5" />}
            </span>
            <span className={isSatisfied ? "text-foreground" : "text-muted-foreground"}>
              {msgStr(messageKey)}
            </span>
            <span className="sr-only">
              {msgStr(isSatisfied ? "etapePasswordRuleMet" : "etapePasswordRuleUnmet")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function joinIds(...ids: (string | undefined)[]): string | undefined {
  const joined = ids.filter((id) => id !== undefined).join(" ");
  return joined === "" ? undefined : joined;
}
