"use client";

import { Label } from "@etape/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@etape/ui/components/radio-group";
import { cn } from "@etape/ui/lib/utils";

import type { RadioField as RadioFieldDef } from "../../domain/types";

interface RadioFieldProps {
  field: RadioFieldDef;
  value: string | undefined;
  onChange: (value: string) => void;
  labelledBy?: string;
  describedBy?: string;
}

export function RadioField({ field, value, onChange, labelledBy, describedBy }: RadioFieldProps) {
  const horizontal = field.orientation === "horizontal";

  return (
    <RadioGroup
      value={value ?? ""}
      onValueChange={onChange}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className={cn(
        "flex",
        horizontal ? "flex-row flex-wrap gap-x-6 gap-y-4 md:gap-x-8" : "flex-col gap-6",
      )}
    >
      {field.options.map((option) => {
        const id = `${field.name}-${option.value}`;
        const labelId = `${id}-label`;
        const descId = option.description ? `${id}-description` : undefined;
        return (
          <Label
            key={option.value}
            htmlFor={id}
            className={cn(
              "min-h-11 cursor-pointer items-start gap-2 md:min-h-0",
              !horizontal && "w-full",
            )}
          >
            <RadioGroupItem
              id={id}
              value={option.value}
              aria-labelledby={labelId}
              aria-describedby={descId}
              className="border-border-strong mt-0.5"
            />
            <span className="flex flex-col gap-1">
              <span id={labelId} className="text-foreground text-sm font-semibold">
                {option.label}
              </span>
              {option.description && (
                <span id={descId} className="text-content-secondary text-sm leading-5">
                  {option.description}
                </span>
              )}
            </span>
          </Label>
        );
      })}
    </RadioGroup>
  );
}
