"use client";

import * as React from "react";
import {
  Controller,
  type Control,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "@etape/ui/components/field";

interface FormFieldAttributes {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
}

interface FormFieldRenderProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  field: ControllerRenderProps<TFieldValues, TName>;
  attributes: FormFieldAttributes;
}

interface FormFieldProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> {
  name: TName;
  /** Par défaut le `name` ; à fournir quand deux champs de même `name` partagent une page. */
  id?: string;
  control: Control<TFieldValues>;
  label: React.ReactNode;
  required?: boolean;
  description?: React.ReactNode;
  render: (props: FormFieldRenderProps<TFieldValues, TName>) => React.ReactNode;
}

/**
 * Champ react-hook-form mis en forme par `Field`. Relie le libellé, la description
 * et l'erreur au contrôle par `attributes` ; l'erreur remplace la description, comme
 * dans le kit. L'`id` du contrôle est son `name` (ou `id` s'il est fourni), pour que
 * le résumé d'erreurs de l'écran puisse y mener par un lien.
 *
 * L'aide disparaît dès que le champ est en erreur : le message d'erreur reprend donc
 * la consigne (« Saisissez les 13 premiers chiffres de votre carte Vitale. » plutôt
 * que « Ce numéro n'est pas valide. »), RGAA 11.11.
 *
 * - Contrôle natif : `render={({ field, attributes }) => <Input {...field} {...attributes} />}`.
 * - Contrôle Radix : brancher la valeur à la main, les attributs sur l'élément focalisable :
 *   `<Select value={field.value} onValueChange={field.onChange}>` puis
 *   `<SelectTrigger ref={field.ref} {...attributes}>`.
 * - Groupe de choix : pas de `FormField`, dont le `<label>` ne peut nommer un groupe.
 *   Boutons radio : `FormRadioGroup` ; cases à cocher : `FieldSet` et `FieldLegend`.
 *
 * Le focus des erreurs revient à l'écran : `useForm({ shouldFocusError: false })`, puis
 * focus sur son résumé d'erreurs à la soumission.
 */
function FormField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  name,
  id = name,
  control,
  label,
  required = false,
  description,
  render,
}: FormFieldProps<TFieldValues, TName>) {
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const errorMessage = fieldState.error?.message;
        const describedBy = errorMessage ? errorId : description ? descriptionId : undefined;

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={id} required={required}>
              {label}
            </FieldLabel>
            {render({
              field,
              attributes: {
                id,
                "aria-invalid": fieldState.invalid,
                "aria-describedby": describedBy,
              },
            })}
            {errorMessage ? (
              <FieldError id={errorId}>{errorMessage}</FieldError>
            ) : (
              description && <FieldDescription id={descriptionId}>{description}</FieldDescription>
            )}
          </Field>
        );
      }}
    />
  );
}

export { FormField };
export type { FormFieldAttributes, FormFieldProps, FormFieldRenderProps };
