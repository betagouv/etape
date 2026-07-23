"use client";

import { Label } from "@etape/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@etape/ui/components/radio-group";
import { cn } from "@etape/ui/lib/utils";

import type { RadioField as RadioFieldDef } from "../../domain/types";

interface RadioFieldProps {
  field: RadioFieldDef;
  value: string | undefined;
  onChange: (value: string) => void;
}

export function RadioField({ field, value, onChange }: RadioFieldProps) {
  const horizontal = field.orientation === "horizontal";

  return (
    <RadioGroup
      value={value ?? ""}
      onValueChange={onChange}
      className={cn("flex", horizontal ? "flex-row flex-wrap gap-8" : "flex-col gap-6")}
    >
      {field.options.map((option) => {
        const id = `${field.name}-${option.value}`;
        return (
          <div key={option.value} className={cn("flex items-start gap-2", !horizontal && "w-full")}>
            <RadioGroupItem id={id} value={option.value} className="border-border-strong mt-0.5" />
            <div className="flex flex-col gap-1">
              <Label htmlFor={id} className="text-foreground text-sm font-semibold">
                {option.label}
              </Label>
              {option.description && (
                <p className="text-content-secondary text-sm leading-5">{option.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </RadioGroup>
  );
}
