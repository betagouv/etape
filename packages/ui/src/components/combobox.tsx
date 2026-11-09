"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckIcon, SearchIcon } from "lucide-react";

import { InputGroup, InputGroupAddon, InputGroupInput } from "@etape/ui/components/input-group";
import { cn } from "@etape/ui/lib/utils";

/*
 * Motif « combobox » de l'APG, liste à autocomplétion affichée dans le fil de la page.
 *
 * Pas de `cmdk`, la bibliothèque du `command` de shadcn : faite pour une palette
 * de commandes, elle annonce sa liste toujours ouverte (`aria-expanded` forcé à
 * `true`) et impose l'`id` du champ, ce qui interdit d'y attacher un `<label>`.
 *
 * Ces parties ne portent que l'apparence et les rôles. Le comportement — ce qui
 * est filtré, l'option active, l'ouverture — appartient à l'appelant, qui
 * renseigne `aria-expanded`, `aria-controls` et `aria-activedescendant` sur le
 * champ.
 *
 * Écart au kit : l'option active porte un anneau, le fond `accent` seul ne marque pas assez le focus.
 */

const comboboxVariants = cva("bg-popover text-popover-foreground flex w-full flex-col border", {
  variants: {
    variant: {
      inline: "rounded-xl p-1",
      // Panneau ouvert sous le champ de recherche d'adresse (Figma FRONT-OFFICE, « 01. SIGN-UP ») :
      // l'appelant le positionne.
      popup: "overflow-hidden rounded-lg shadow-md",
    },
  },
  defaultVariants: {
    variant: "inline",
  },
});

function Combobox({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof comboboxVariants>) {
  return (
    <div data-slot="combobox" className={cn(comboboxVariants({ variant }), className)} {...props} />
  );
}

/** Ligne d'en-tête du panneau, par exemple le nombre de résultats. */
function ComboboxHeader({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="combobox-header"
      className={cn("text-muted-foreground border-b p-3 text-sm", className)}
      {...props}
    />
  );
}

function ComboboxInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <div data-slot="combobox-input-wrapper" className="p-1">
      <InputGroup size="responsive">
        <InputGroupAddon aria-hidden="true">
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          data-slot="combobox-input"
          role="combobox"
          aria-autocomplete="list"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className={className}
          {...props}
        />
      </InputGroup>
    </div>
  );
}

/**
 * La liste. Elle reste montée, masquée par `hidden` quand elle est fermée : le
 * `aria-controls` du champ doit toujours désigner un élément existant.
 */
function ComboboxList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="combobox-list"
      role="listbox"
      className={cn(
        "max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto overscroll-contain p-1",
        className,
      )}
      {...props}
    />
  );
}

const comboboxOptionVariants = cva(
  [
    "hover:bg-accent hover:text-accent-foreground flex min-h-11 cursor-pointer items-center gap-2 text-sm select-none md:min-h-8",
    "data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[active=true]:ring-ring data-[active=true]:ring-2 data-[active=true]:ring-inset",
  ],
  {
    variants: {
      variant: {
        default: "rounded-sm px-2 py-1.5",
        // Options sur deux lignes séparées par un filet, dans une liste collée aux bords du
        // panneau (`ComboboxList` sans marge) : suggestions d'adresse, Figma « 01. SIGN-UP ».
        separated: "rounded-none border-b px-3 py-2 last:border-b-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function ComboboxOption({
  className,
  variant,
  selected = false,
  active = false,
  children,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof comboboxOptionVariants> & {
    selected?: boolean;
    /** Option désignée au clavier (`aria-activedescendant` du champ). */
    active?: boolean;
  }) {
  return (
    <li
      data-slot="combobox-option"
      role="option"
      aria-selected={selected}
      data-active={active}
      className={cn(comboboxOptionVariants({ variant }), className)}
      {...props}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {selected && <CheckIcon aria-hidden="true" className="size-4 shrink-0" />}
    </li>
  );
}

function ComboboxEmpty({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="combobox-empty"
      className={cn("text-muted-foreground px-3 py-2 text-sm", className)}
      {...props}
    />
  );
}

export { Combobox, ComboboxHeader, ComboboxInput, ComboboxList, ComboboxOption, ComboboxEmpty };
