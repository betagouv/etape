"use client";

import { InputGroup, InputGroupAddon, InputGroupInput } from "@etape/ui/components/input-group";

import type { NumberField as NumberFieldDef } from "../../domain/types";
import { fieldErrorMark, joinIds } from "./aria";
import { FieldError } from "./FieldError";

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
 * Saisie d'un entier au clavier : libellé, champ avec son unité, exemple dessous
 * (maquette Q5).
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

  const hintId = field.hint ? `${field.name}-hint` : undefined;
  const inputId = field.name;
  const errorId = `${field.name}-error`;

  return (
    <div className="flex w-full flex-col gap-2">
      {field.label && (
        <label htmlFor={inputId} className="text-foreground text-sm font-medium">
          {field.label}
        </label>
      )}
      <InputGroup size="lg">
        <InputGroupInput
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
        />
        {/* L'unité est déjà dans le libellé (« Nombre d'années ») : la lire
            après la valeur ferait doublon. */}
        {field.suffix && (
          <InputGroupAddon align="inline-end" aria-hidden="true">
            {field.suffix}
          </InputGroupAddon>
        )}
      </InputGroup>
      {field.hint && (
        <p id={hintId} className="text-muted-foreground text-sm">
          {field.hint}
        </p>
      )}
      <FieldError id={errorId} message={error} />
    </div>
  );
}
