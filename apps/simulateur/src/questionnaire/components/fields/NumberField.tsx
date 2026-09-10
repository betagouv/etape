"use client";

import { Input } from "@etape/ui/components/input";

import type { NumberField as NumberFieldDef } from "../../domain/types";
import { fieldErrorMark, joinIds } from "./aria";
import { FieldError } from "./FieldError";
import { FieldHeader } from "./FieldHeader";

interface NumberFieldProps {
  field: NumberFieldDef;
  value: string | undefined;
  onChange: (value: string | null) => void;
  labelledBy?: string;
  describedBy?: string;
  /** Message affiché sous le champ quand la saisie manque ou est hors bornes. */
  error?: string;
}

/**
 * Saisie d'un entier au clavier.
 *
 * `type="text"` avec `inputMode="numeric"` plutôt que `type="number"` : ce
 * dernier apporte des flèches d'incrément, réagit à la molette de la souris et
 * accepte `e`, `+` et `-`. On veut des chiffres, et un pavé numérique sur
 * mobile. La saisie est filtrée à la frappe : un caractère non numérique
 * n'entre pas, et la longueur est bornée par le maximum du champ.
 */
export function NumberField({
  field,
  value,
  onChange,
  labelledBy,
  describedBy,
  error,
}: NumberFieldProps) {
  const maxLength = String(field.max ?? 99).length;

  const labelId = field.label ? `${field.name}-label` : undefined;
  const hintId = field.hint ? `${field.name}-hint` : undefined;
  const inputId = field.name;
  const errorId = `${field.name}-error`;

  return (
    <div className="flex w-full flex-col gap-2">
      <FieldHeader
        labelId={labelId}
        label={field.label}
        hintId={hintId}
        hint={field.hint}
        htmlFor={inputId}
      />
      <div className="flex items-center gap-2">
        <Input
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={maxLength}
          value={value ?? ""}
          placeholder={field.placeholder}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "").slice(0, maxLength);
            onChange(digits === "" ? null : digits);
          }}
          // Le `<label for>` nomme le champ quand il existe ; sinon c'est le
          // titre de la question, seul texte disponible.
          aria-labelledby={field.label ? undefined : labelledBy}
          aria-describedby={joinIds(hintId, error ? errorId : undefined, describedBy)}
          aria-invalid={error ? true : undefined}
          {...fieldErrorMark(error)}
          className="h-11 w-20 md:h-9"
        />
        {field.suffix && (
          <span className="text-content-secondary text-sm leading-5" aria-hidden="true">
            {field.suffix}
          </span>
        )}
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  );
}
