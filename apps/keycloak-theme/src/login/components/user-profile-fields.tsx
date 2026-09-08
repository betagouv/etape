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
  /** Rendu sous le champ `password` : les règles à respecter. */
  passwordAddon?: (value: string) => ReactNode;
  /**
   * Faire ressaisir le mot de passe. Quand c'est écarté, le champ n'est pas
   * retiré mais masqué : Keycloakify l'ajoute toujours au profil et y recopie la
   * valeur saisie, et Keycloak refuse l'inscription s'il ne le reçoit pas.
   */
  confirmPassword?: boolean;
}) {
  const {
    formFieldStates,
    dispatchFormAction,
    i18n,
    passwordAddon,
    confirmPassword = true,
  } = props;

  const estMasque = (nom: string) =>
    HIDDEN.includes(nom) || (nom === "password-confirm" && !confirmPassword);

  const hidden = formFieldStates.filter((field) => estMasque(field.attribute.name));

  /*
   * Keycloak ordonne le profil avec l'identifiant en premier — ici l'email —
   * puis le reste. Les maquettes commencent par l'identité. On remonte donc
   * prénom et nom, sans toucher à l'ordre relatif des autres champs, pour qu'un
   * attribut ajouté plus tard dans la console apparaisse à sa place.
   */
  const visible = [
    ...formFieldStates.filter((field) => SIDE_BY_SIDE.includes(field.attribute.name)),
    ...formFieldStates.filter(
      (field) => !SIDE_BY_SIDE.includes(field.attribute.name) && !estMasque(field.attribute.name),
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

/**
 * Règles du mot de passe, vérifiées à la frappe.
 *
 * Elles reprennent **exactement** la politique du realm — c'est elle qui fait
 * autorité, et Keycloak la réapplique à l'envoi. Les deux doivent donc être
 * modifiées ensemble : une règle affichée ici et absente du realm laisserait
 * passer, l'inverse ferait échouer un formulaire qui paraît complet.
 *
 * Les tests reproduisent la lecture de Keycloak, qui s'appuie sur les
 * catégories Unicode de Java : `é` est une lettre, donc ni un chiffre ni un
 * caractère spécial. Un `[^A-Za-z0-9]` la compterait comme spéciale et
 * annoncerait une règle satisfaite que le serveur refuserait ensuite.
 */
export function PasswordRules(props: { value: string; i18n: I18n; minLength?: number }) {
  const { value, i18n, minLength = 12 } = props;
  const { msgStr } = i18n;

  const regles = [
    // `length` et non le nombre de points de code : Java compte lui aussi des
    // unités UTF-16, et c'est son décompte qui fait foi.
    { cle: "etapePasswordRuleLength", satisfaite: value.length >= minLength },
    { cle: "etapePasswordRuleUpper", satisfaite: /\p{Lu}/u.test(value) },
    { cle: "etapePasswordRuleLower", satisfaite: /\p{Ll}/u.test(value) },
    { cle: "etapePasswordRuleDigit", satisfaite: /\p{Nd}/u.test(value) },
    { cle: "etapePasswordRuleSpecial", satisfaite: /[^\p{L}\p{N}]/u.test(value) },
  ] as const;

  return (
    <div className="flex flex-col gap-1">
      <p className="text-body-sm text-muted-foreground">{msgStr("etapePasswordRulesTitle")}</p>
      <ul className="flex flex-col gap-1">
        {regles.map(({ cle, satisfaite }) => (
          <li key={cle} className="text-body-sm flex items-center gap-2">
            {/*
             * L'icône est décorative et la couleur ne porte rien à elle seule :
             * l'état est aussi écrit, pour qui ne distingue pas le vert du gris
             * comme pour qui écoute la page.
             */}
            {satisfaite ? (
              <Check aria-hidden className="text-success size-4 shrink-0" />
            ) : (
              <Circle aria-hidden className="text-muted-foreground size-4 shrink-0" />
            )}
            <span className={satisfaite ? "text-success" : "text-muted-foreground"}>
              {msgStr(cle)}
            </span>
            <span className="sr-only">
              {msgStr(satisfaite ? "etapePasswordRuleMet" : "etapePasswordRuleUnmet")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
