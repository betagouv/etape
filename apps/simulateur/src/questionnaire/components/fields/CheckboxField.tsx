"use client";

import { Checkbox } from "@etape/ui/components/checkbox";
import { Label } from "@etape/ui/components/label";

import type { CheckboxField as CheckboxFieldDef, Option } from "../../domain/types";
import { OptionRow } from "./OptionRow";

interface CheckboxFieldProps {
  field: CheckboxFieldDef;
  value: string[];
  onChange: (value: string[]) => void;
  labelledBy?: string;
  describedBy?: string;
}

export function CheckboxField({
  field,
  value,
  onChange,
  labelledBy,
  describedBy,
}: CheckboxFieldProps) {
  const isExclusive = (optionValue: string) =>
    field.options.some((candidate) => candidate.value === optionValue && candidate.exclusive);

  function toggle(option: Option, checked: boolean) {
    if (!checked) {
      onChange(value.filter((v) => v !== option.value));
      return;
    }
    if (option.exclusive) {
      onChange([option.value]);
      return;
    }
    onChange([...value.filter((v) => v !== option.value && !isExclusive(v)), option.value]);
  }

  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className="flex w-full flex-col gap-6"
    >
      {field.options.map((option) => {
        const id = `${field.name}-${option.value}`;
        const labelId = `${id}-label`;
        const descId = option.description ? `${id}-description` : undefined;
        return (
          <Label
            key={option.value}
            htmlFor={id}
            className="min-h-11 w-full cursor-pointer items-start gap-2 md:min-h-0"
          >
            <Checkbox
              id={id}
              checked={value.includes(option.value)}
              onCheckedChange={(state) => toggle(option, state === true)}
              aria-labelledby={labelId}
              aria-describedby={descId}
              className="border-border-strong size-5"
            />
            <OptionRow
              labelId={labelId}
              descId={descId}
              label={option.label}
              description={option.description}
            />
          </Label>
        );
      })}
    </div>
  );
}
