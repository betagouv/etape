import type { FormAction, FormFieldState } from "keycloakify/login/lib/useUserProfileForm";
import { Check, Circle, Mail, User } from "lucide-react";
import type { ChangeEvent, ComponentType, ReactNode } from "react";

import type { I18n } from "../i18n";
import { Field, FieldError, PasswordInput, TextInput } from "./form";

type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

const iconByAttributeName: Record<string, IconComponent> = {
  email: Mail,
  username: User,
  firstName: User,
  lastName: User,
};

/** Les deux champs que les maquettes placent côte à côte, et en premier. */
const SIDE_BY_SIDE: readonly string[] = ["firstName", "lastName"];

/**
 * Attributs techniques, soumis mais jamais montrés.
 *
 * `locale` apparaît dans le profil dès que l'internationalisation est activée.
 * Le proposer en champ de formulaire n'a pas de sens : la langue se choisit dans
 * l'en-tête, et avec une seule langue supportée le champ n'offre aucun choix.
 */
const HIDDEN: readonly string[] = ["locale"];

/**
 * Rend le formulaire décrit par le *user profile* de Keycloak.
 *
 * Les champs d'inscription ne sont pas écrits en dur : Keycloak les déclare
 * (nom, ordre, obligation, validateurs), et l'écran s'y conforme. Ajouter un
 * attribut dans la console le fait apparaître ici sans toucher au thème.
 *
 * Limite assumée : les attributs *multivalués* ne sont pas gérés — le profil du
 * realm n'en contient aucun. En ajouter un demanderait d'étendre ce composant,
 * sans quoi seule la première valeur serait éditable.
 */
export function UserProfileFields(props: {
  formFieldStates: FormFieldState[];
  dispatchFormAction: (action: FormAction) => void;
  i18n: I18n;
  passwordAddon?: (value: string) => ReactNode;
  confirmPassword?: boolean;
}) {
  const {
    formFieldStates,
    dispatchFormAction,
    i18n,
    passwordAddon,
    confirmPassword = true,
  } = props;

  const isHiddenField = (name: string) =>
    HIDDEN.includes(name) || (name === "password-confirm" && !confirmPassword);

  const hidden = formFieldStates.filter((field) => isHiddenField(field.attribute.name));

  /*
   * Keycloak ordonne le profil avec l'identifiant en premier — ici l'email —
   * puis le reste. Les maquettes commencent par l'identité. On remonte donc
   * prénom et nom, sans toucher à l'ordre relatif des autres champs, pour qu'un
   * attribut ajouté plus tard dans la console apparaisse à sa place.
   */
  const visible = [
    ...formFieldStates.filter((field) => SIDE_BY_SIDE.includes(field.attribute.name)),
    ...formFieldStates.filter(
      (field) =>
        !SIDE_BY_SIDE.includes(field.attribute.name) && !isHiddenField(field.attribute.name),
    ),
  ];

  const rendered: ReactNode[] = [];

  for (let index = 0; index < visible.length; index++) {
    const fieldState = visible[index]!;
    const next = visible[index + 1];

    const isPair =
      SIDE_BY_SIDE.includes(fieldState.attribute.name) &&
      next !== undefined &&
      SIDE_BY_SIDE.includes(next.attribute.name);

    if (isPair) {
      rendered.push(
        <div key={fieldState.attribute.name} className="grid gap-4 sm:grid-cols-2">
          <UserProfileField
            fieldState={fieldState}
            dispatchFormAction={dispatchFormAction}
            i18n={i18n}
          />
          <UserProfileField fieldState={next} dispatchFormAction={dispatchFormAction} i18n={i18n} />
        </div>,
      );
      index++;
      continue;
    }

    rendered.push(
      <UserProfileField
        key={fieldState.attribute.name}
        fieldState={fieldState}
        dispatchFormAction={dispatchFormAction}
        i18n={i18n}
        addon={
          fieldState.attribute.name === "password" && passwordAddon !== undefined
            ? passwordAddon(
                typeof fieldState.valueOrValues === "string" ? fieldState.valueOrValues : "",
              )
            : undefined
        }
      />,
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {rendered}
      {hidden.map((field) => (
        <input
          key={field.attribute.name}
          type="hidden"
          name={field.attribute.name}
          value={typeof field.valueOrValues === "string" ? field.valueOrValues : ""}
          readOnly
        />
      ))}
    </div>
  );
}

function UserProfileField(props: {
  fieldState: FormFieldState;
  dispatchFormAction: (action: FormAction) => void;
  i18n: I18n;
  addon?: ReactNode;
  className?: string;
}) {
  const { fieldState, dispatchFormAction, i18n, addon, className } = props;
  const { attribute, displayableErrors, valueOrValues } = fieldState;
  const { advancedMsg, advancedMsgStr } = i18n;

  const value = typeof valueOrValues === "string" ? valueOrValues : (valueOrValues[0] ?? "");
  const isInvalid = displayableErrors.length !== 0;
  const isPassword = attribute.name === "password" || attribute.name === "password-confirm";

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
    invalid: isInvalid,
    "aria-required": attribute.required,
    // Rattache le message d'erreur au champ : `aria-invalid` signale qu'il y a
    // une erreur, `aria-describedby` est ce qui en fait lire l'énoncé.
    "aria-describedby": isInvalid ? `input-error-${attribute.name}` : undefined,
  };

  return (
    <Field
      id={attribute.name}
      className={className}
      label={advancedMsg(attribute.displayName ?? attribute.name)}
      required={attribute.required}
      hint={
        attribute.annotations.inputHelperTextAfter === undefined
          ? undefined
          : advancedMsg(attribute.annotations.inputHelperTextAfter)
      }
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
          type={attribute.name === "email" ? "email" : "text"}
          icon={iconByAttributeName[attribute.name]}
        />
      )}
      {addon}
    </Field>
  );
}

export function PasswordRules(props: { value: string; i18n: I18n; minLength?: number }) {
  const { value, i18n, minLength = 12 } = props;
  const { msgStr } = i18n;

  const rules = [
    { messageKey: "etapePasswordRuleLength", isSatisfied: value.length >= minLength },
    { messageKey: "etapePasswordRuleUpper", isSatisfied: /\p{Lu}/u.test(value) },
    { messageKey: "etapePasswordRuleLower", isSatisfied: /\p{Ll}/u.test(value) },
    { messageKey: "etapePasswordRuleDigit", isSatisfied: /\p{Nd}/u.test(value) },
    { messageKey: "etapePasswordRuleSpecial", isSatisfied: /[^\p{L}\p{N}]/u.test(value) },
  ] as const;

  return (
    <div className="flex flex-col gap-1">
      <p className="text-body-sm text-muted-foreground">{msgStr("etapePasswordRulesTitle")}</p>
      <ul className="flex flex-col gap-1">
        {rules.map(({ messageKey, isSatisfied }) => (
          <li key={messageKey} className="text-body-sm flex items-center gap-2">
            {isSatisfied ? (
              <Check aria-hidden className="text-success size-4 shrink-0" />
            ) : (
              <Circle aria-hidden className="text-muted-foreground size-4 shrink-0" />
            )}
            <span className={isSatisfied ? "text-success" : "text-muted-foreground"}>
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
