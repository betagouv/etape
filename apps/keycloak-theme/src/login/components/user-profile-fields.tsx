import { cn } from "@etape/ui/lib/utils";
import type { FormAction, FormFieldState } from "keycloakify/login/lib/useUserProfileForm";
import { Mail, User } from "lucide-react";
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
  /** Rendu sous le champ `password`, pour la jauge de robustesse. */
  passwordAddon?: (value: string) => ReactNode;
}) {
  const { formFieldStates, dispatchFormAction, i18n, passwordAddon } = props;

  const hidden = formFieldStates.filter((field) => HIDDEN.includes(field.attribute.name));

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
        !SIDE_BY_SIDE.includes(field.attribute.name) && !HIDDEN.includes(field.attribute.name),
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
            message={displayableErrors[0]!.errorMessageStr}
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

/**
 * Jauge indicative de robustesse du mot de passe.
 *
 * Purement visuelle : la seule règle qui fait autorité est la politique du
 * realm (`length(12)`, refus du mot de passe identique à l'identifiant,
 * historique), appliquée par Keycloak au moment de l'envoi. Cette jauge aide à
 * la saisie, elle ne valide rien.
 */
export function PasswordStrength(props: { value: string; i18n: I18n; minLength?: number }) {
  const { value, i18n, minLength = 12 } = props;
  const { msgStr } = i18n;

  if (value === "") {
    return null;
  }

  const varieties = [/[a-z]/, /[A-Z]/, /\d/, /[^\w\s]/].filter((pattern) =>
    pattern.test(value),
  ).length;

  const score =
    value.length < minLength ? 1 : value.length >= minLength + 4 && varieties >= 3 ? 3 : 2;

  const label = [
    msgStr("etapePasswordStrengthWeak"),
    msgStr("etapePasswordStrengthMedium"),
    msgStr("etapePasswordStrengthStrong"),
  ][score - 1];

  const color = ["bg-warning", "bg-primary", "bg-success"][score - 1];

  return (
    <div className="flex flex-col gap-1">
      <div aria-hidden className="flex gap-1">
        {[1, 2, 3].map((segment) => (
          <span
            key={segment}
            className={cn("h-1 flex-1 rounded-full", segment <= score ? color : "bg-muted")}
          />
        ))}
      </div>
      <p aria-live="polite" className="text-body-sm text-muted-foreground">
        {msgStr("etapePasswordStrength")} : {label}
      </p>
    </div>
  );
}
