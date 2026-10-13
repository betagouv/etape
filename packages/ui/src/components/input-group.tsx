"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { Input } from "@etape/ui/components/input";
import { cn } from "@etape/ui/lib/utils";

/*
 * Champ de saisie accompagné d'un complément affiché dans son cadre : une
 * unité (« ans »), une icône. Source shadcn `input-group`, réduite au champ
 * texte et aux compléments — ni bouton ni zone de texte, sans usage ici.
 *
 * Le cadre est porté par le groupe ; le champ, sans bordure, s'y fond. Focus et
 * erreur se lisent sur le champ (`:focus-visible`, `aria-invalid`) et
 * s'affichent sur le cadre.
 */
const inputGroupVariants = cva(
  [
    "group/input-group border-input bg-background dark:bg-input/30 relative flex w-full min-w-0 items-center border shadow-xs transition-[color,box-shadow] outline-none",
    "has-[>[data-align=inline-start]]:[&>input]:pl-2",
    "has-[>[data-align=inline-end]]:[&>input]:pr-2",
    "has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[[data-slot=input-group-control]:focus-visible]:ring-[3px]",
    "has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-destructive/20 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 has-[[data-slot][aria-invalid=true]]:ring-[3px]",
  ],
  {
    variants: {
      size: {
        default: "h-9 rounded-md",
        // « Size=LG » du kit (48 px), celle des champs du simulateur.
        lg: "h-12 rounded-lg [&>input]:px-4",
        // Champ de recherche d'une liste de suggestions (maquette SIMULATEUR-v3,
        // Q7) : les 32 px du kit sur desktop, 44 px au doigt.
        responsive: "h-11 rounded-lg md:h-8",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

function InputGroup({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupVariants>) {
  return (
    <div
      data-slot="input-group"
      data-size={size}
      className={cn(inputGroupVariants({ size }), className)}
      {...props}
    />
  );
}

const inputGroupAddonVariants = cva(
  "text-muted-foreground flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium select-none [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        "inline-start": "order-first pl-3 group-data-[size=lg]/input-group:pl-4",
        "inline-end": "order-last pr-3 group-data-[size=lg]/input-group:pr-4",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  },
);

/**
 * Complément affiché dans le cadre. Un clic dessus donne le focus au champ,
 * comme un clic sur le reste du cadre.
 */
function InputGroupAddon({
  className,
  align = "inline-start",
  onClick,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(event) => {
        event.currentTarget.parentElement?.querySelector("input")?.focus();
        onClick?.(event);
      }}
      {...props}
    />
  );
}

function InputGroupInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "h-full flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

export { InputGroup, InputGroupAddon, InputGroupInput };
