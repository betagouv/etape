"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { cn } from "@etape/ui/lib/utils";

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  );
}

/** Bord en `primary` : le teal-200 du kit ne fait que 1,3:1. Coché, le bord s'épaissit (pas de puce) : lisible en contraste élevé. */
function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "border-primary bg-background focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[border-width,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[5px]",
        className,
      )}
      {...props}
    />
  );
}

const radioGroupChipVariants = cva(
  "border-border bg-background text-body-sm text-foreground hover:bg-secondary focus-visible:border-ring focus-visible:ring-ring/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground aria-invalid:border-destructive inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border whitespace-nowrap transition-[color,background-color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-6 px-2",
        responsive: "h-10 px-5 md:h-6 md:px-2",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  },
);

/** Choix en pastille : un vrai radio Radix (flèches, « coché »), sans puce. */
function RadioGroupChip({
  className,
  size,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item> &
  VariantProps<typeof radioGroupChipVariants>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-chip"
      className={cn(radioGroupChipVariants({ size }), className)}
      {...props}
    />
  );
}

export { RadioGroup, RadioGroupChip, RadioGroupItem };
