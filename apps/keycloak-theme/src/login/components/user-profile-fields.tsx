import { Criterion, CRITERION_STATUS, type CriterionStatus } from "@etape/ui/components/criterion";
import { InsetPanel, INSET_PANEL_VARIANT } from "@etape/ui/components/inset-panel";
import type { FormAction, FormFieldState } from "keycloakify/login/lib/useUserProfileForm";
import type { ChangeEvent, ComponentProps, ReactNode } from "react";

import type { I18n } from "../i18n";
import { Field, FieldError, fieldHintId, PasswordInput, TextInput } from "./form";
import { getPasswordRules, PASSWORD_MIN_LENGTH } from "./password-rules";
import { useActionPress } from "../hooks/use-action-press";

export const PASSWORD_RULES_ID = "password-rules";

const RULE_STATUS_LABEL: Record<CriterionStatus, Parameters<I18n["msgStr"]>[0]> = {
  [CRITERION_STATUS.MET]: "etapePasswordRuleMet",
  [CRITERION_STATUS.UNMET]: "etapePasswordRuleUnmet",
};

/** Attributs Keycloak du profil que l'inscription lit par leur nom. */
export const USER_PROFILE_ATTRIBUTE = {
  EMAIL: "email",
  FIRST_NAME: "firstName",
  LAST_NAME: "lastName",
  LOCALE: "locale",
  PASSWORD: "password",
  PASSWORD_CONFIRM: "password-confirm",
} as const;

/** Props de `UserProfileField`. */
export interface UserProfileFieldProps {
  fieldState: FormFieldState;
  dispatchFormAction: (action: FormAction) => void;
  i18n: I18n;
  hint?: ReactNode;
  /** Affiché sous le champ, relié par `aria-describedby` (règles du mot de passe). */
  addon?: ReactNode;
  inputProps?: Pick<ComponentProps<"input">, "autoFocus" | "onFocus">;
}

/** Un attribut du profil Keycloak, rendu en champ texte ou mot de passe. */
export function UserProfileField(props: UserProfileFieldProps) {
  const { fieldState, dispatchFormAction, i18n, hint, addon, inputProps } = props;
  const { attribute, displayableErrors, valueOrValues } = fieldState;
  const { advancedMsg, advancedMsgStr } = i18n;

  const value = typeof valueOrValues === "string" ? valueOrValues : (valueOrValues[0] ?? "");
  const isInvalid = displayableErrors.length !== 0;
  const isPassword =
    attribute.name === USER_PROFILE_ATTRIBUTE.PASSWORD ||
    attribute.name === USER_PROFILE_ATTRIBUTE.PASSWORD_CONFIRM;

  const onChange = (nextValue: string) =>
    dispatchFormAction({ action: "update", name: attribute.name, valueOrValues: nextValue });

  const isActionPressed = useActionPress();

  const onBlur = () => {
    if (isActionPressed.current) return;
    dispatchFormAction({ action: "focus lost", name: attribute.name, fieldIndex: undefined });
  };

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
    ...inputProps,
    invalid: isInvalid,
    "aria-required": attribute.required,
    "aria-describedby": joinIds(
      isInvalid ? `input-error-${attribute.name}` : undefined,
      hint !== undefined ? fieldHintId(attribute.name) : undefined,
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
    <InsetPanel id={PASSWORD_RULES_ID} variant={INSET_PANEL_VARIANT.COMPACT}>
      <p className="text-foreground text-sm">{msgStr("etapePasswordRulesTitle")}</p>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2">
        {rules.map(({ messageKey, isSatisfied }) => {
          const status = isSatisfied ? CRITERION_STATUS.MET : CRITERION_STATUS.UNMET;
          return (
            <Criterion
              key={messageKey}
              status={status}
              statusLabel={msgStr(RULE_STATUS_LABEL[status])}
            >
              {msgStr(messageKey)}
            </Criterion>
          );
        })}
      </ul>
    </InsetPanel>
  );
}

function joinIds(...ids: (string | undefined)[]): string | undefined {
  const joined = ids.filter((id) => id !== undefined).join(" ");
  return joined === "" ? undefined : joined;
}
