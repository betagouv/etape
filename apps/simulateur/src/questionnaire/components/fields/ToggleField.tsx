"use client";

import { Checkbox } from "@etape/ui/components/checkbox";
import { Label } from "@etape/ui/components/label";

import type { ToggleField as ToggleFieldDef } from "../../domain/types";
import { joinIds } from "./aria";

interface ToggleFieldProps {
  field: ToggleFieldDef;
  value: boolean;
  onChange: (value: boolean) => void;
  describedBy?: string;
}

/**
 * Case à cocher unique. Contrairement à `CheckboxField`, elle ne choisit pas
 * dans une liste : elle porte une seule affirmation, et son libellé est son nom
 * accessible. Décochée est une réponse — le champ n'est jamais « incomplet ».
 */
export function ToggleField({ field, value, onChange, describedBy }: ToggleFieldProps) {
  const hintId = field.hint ? `${field.name}-hint` : undefined;

  return (
    <div className="flex w-full flex-col gap-1">
      <Label
        htmlFor={field.name}
        className="min-h-11 w-full cursor-pointer items-start gap-2 md:min-h-0"
      >
        <Checkbox
          id={field.name}
          checked={value}
          onCheckedChange={(state) => onChange(state === true)}
          aria-describedby={joinIds(hintId, describedBy)}
          className="border-border-strong size-5"
        />
        <span className="text-foreground text-sm font-semibold">{field.label}</span>
      </Label>
      {field.hint && (
        <p id={hintId} className="text-content-secondary ps-7 text-sm leading-5">
          {field.hint}
        </p>
      )}
    </div>
  );
}
