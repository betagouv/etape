"use client";

import { Checkbox } from "@etape/ui/components/checkbox";
import { Label } from "@etape/ui/components/label";

import type { CheckboxField as CheckboxFieldDef, Option } from "../../domain/types";

interface CheckboxFieldProps {
  field: CheckboxFieldDef;
  value: string[];
  onChange: (value: string[]) => void;
}

export function CheckboxField({ field, value, onChange }: CheckboxFieldProps) {
  const isExclusive = (optionValue: string) =>
    field.options.some((option) => option.value === optionValue && option.exclusive);

  function toggle(option: Option, checked: boolean) {
    if (!checked) {
      onChange(value.filter((v) => v !== option.value));
      return;
    }
    // Cocher une option exclusive vide la sélection ; cocher une option normale
    // retire les options exclusives.
    if (option.exclusive) {
      onChange([option.value]);
      return;
    }
    onChange([...value.filter((v) => !isExclusive(v)), option.value]);
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {field.options.map((option) => {
        const id = `${field.name}-${option.value}`;
        return (
          <div key={option.value} className="flex w-full items-start gap-2">
            <Checkbox
              id={id}
              checked={value.includes(option.value)}
              onCheckedChange={(state) => toggle(option, state === true)}
              className="border-border-strong size-5"
            />
            <Label htmlFor={id} className="text-foreground text-sm font-semibold">
              {option.label}
            </Label>
          </div>
        );
      })}
    </div>
  );
}
