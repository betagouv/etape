import { cn } from "@etape/ui/lib/utils";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import { useIsPasswordRevealed } from "keycloakify/tools/useIsPasswordRevealed";
import { Eye, EyeOff } from "lucide-react";
import type { ComponentProps, ComponentType, ReactNode } from "react";

import type { I18n } from "../i18n";

type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

/**
 * Libellé + contrôle + message d'erreur.
 *
 * L'astérisque des maquettes est décorative : c'est `aria-required` sur le
 * champ qui porte l'information pour les technologies d'assistance.
 */
export function Field(props: {
  id: string;
  label: ReactNode;
  required?: boolean;
  labelAction?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const { id, label, required = false, labelAction, hint, error, className, children } = props;

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <label htmlFor={id} className="text-body-sm text-foreground font-medium">
            {label}
            {required && (
              <span aria-hidden className="text-destructive ms-0.5">
                *
              </span>
            )}
          </label>
          {labelAction}
        </div>
        {children}
        {hint !== undefined && <p className="text-body-sm text-muted-foreground">{hint}</p>}
      </div>
      <div role="status" className="[&:not(:empty)]:mt-2">
        {error}
      </div>
    </div>
  );
}

/**
 * Boîte du champ : bordure, icône de tête, action de queue.
 *
 * Le focus est porté par le conteneur (`focus-within`) et non par l'`input`,
 * sans quoi l'anneau de focus s'afficherait à l'intérieur de la bordure.
 */
function InputShell(props: {
  icon?: IconComponent;
  trailing?: ReactNode;
  invalid?: boolean;
  children: ReactNode;
}) {
  const { icon: Icon, trailing, invalid = false, children } = props;

  return (
    <div
      data-invalid={invalid || undefined}
      className={cn(
        "border-input bg-background flex min-h-11 w-full items-center gap-1.5 rounded-lg border px-4 transition-[color,box-shadow]",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        "data-invalid:border-destructive data-invalid:ring-destructive/20 data-invalid:ring-[3px]",
      )}
    >
      {Icon !== undefined && <Icon aria-hidden className="text-muted-foreground size-4 shrink-0" />}
      {children}
      {trailing}
    </div>
  );
}

const inputClassName =
  "text-body-sm placeholder:text-muted-foreground min-h-0 w-full min-w-0 rounded-none border-0 bg-transparent p-0 outline-none disabled:cursor-not-allowed disabled:opacity-50";

export function TextInput({
  icon,
  invalid,
  className,
  ...props
}: ComponentProps<"input"> & { icon?: IconComponent; invalid?: boolean }) {
  return (
    <InputShell icon={icon} invalid={invalid}>
      <input {...props} aria-invalid={invalid} className={cn(inputClassName, className)} />
    </InputShell>
  );
}

/**
 * Champ mot de passe avec bascule d'affichage.
 *
 * `useIsPasswordRevealed` bascule l'attribut `type` de l'`input` directement
 * dans le DOM — d'où l'`id` obligatoire, qui sert de point d'ancrage.
 */
export function PasswordInput({
  id,
  i18n,
  invalid,
  className,
  ...props
}: ComponentProps<"input"> & { id: string; i18n: I18n; invalid?: boolean }) {
  const { msgStr } = i18n;
  const { isPasswordRevealed, toggleIsPasswordRevealed } = useIsPasswordRevealed({
    passwordInputId: id,
  });

  return (
    <InputShell
      invalid={invalid}
      trailing={
        <button
          type="button"
          onClick={toggleIsPasswordRevealed}
          aria-label={msgStr(isPasswordRevealed ? "hidePassword" : "showPassword")}
          aria-controls={id}
          className="text-muted-foreground hover:text-foreground focus-visible:outline-ring shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {isPasswordRevealed ? (
            <Eye aria-hidden className="size-4" />
          ) : (
            <EyeOff aria-hidden className="size-4" />
          )}
        </button>
      }
    >
      <input
        {...props}
        id={id}
        type="password"
        aria-invalid={invalid}
        className={cn(inputClassName, className)}
      />
    </InputShell>
  );
}

/**
 * Message d'erreur d'un champ.
 *
 * Keycloak renvoie ses messages en HTML (ils contiennent des `<b>`, parfois un
 * lien) : `kcSanitize` est ce qui permet de les rendre sans ouvrir une injection.
 */
export function FieldError(props: { id: string; message: string }) {
  return (
    <span
      id={props.id}
      className="text-body-sm text-muted-foreground"
      dangerouslySetInnerHTML={{ __html: kcSanitize(props.message) }}
    />
  );
}

/** Case à cocher native, teintée aux couleurs du produit. */
export function CheckboxField(props: ComponentProps<"input"> & { id: string; label: ReactNode }) {
  const { id, label, className, ...inputProps } = props;

  return (
    <div className="flex items-center gap-2">
      <input
        {...inputProps}
        id={id}
        type="checkbox"
        className={cn(
          "accent-primary focus-visible:outline-ring size-5 shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2",
          className,
        )}
      />
      <label htmlFor={id} className="text-body-sm text-foreground cursor-pointer font-semibold">
        {label}
      </label>
    </div>
  );
}
