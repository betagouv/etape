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
 * Écarts au kit : l'option active porte un anneau, le fond `accent` seul ne marque pas
 * assez le focus ; sur mobile, champ et options font 44 px de haut (cible tactile) au
 * lieu des 32 et 28 px du kit.
 */

const comboboxVariants = cva("bg-popover text-popover-foreground flex w-full flex-col", {
  variants: {
    variant: {
      default: "border-foreground/10 rounded-lg border shadow-md",
      /** Dans un `PopoverContent` ou tout cadre qui porte déjà bordure et rayon. */
      inset: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Combobox({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof comboboxVariants>) {
  return (
    <div
      data-slot="combobox"
      data-variant={variant}
      className={cn(comboboxVariants({ variant }), className)}
      {...props}
    />
  );
}

function ComboboxInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <div data-slot="combobox-input-wrapper" className="px-1 pt-1">
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

/**
 * Groupe d'options sous un intitulé, comme le « Select Menu / Label » du kit. Le
 * `<li>` est transparent pour l'ARIA : la liste contient un `group` nommé par son intitulé.
 */
function ComboboxGroup({
  label,
  className,
  children,
  ...props
}: React.ComponentProps<"li"> & { label: React.ReactNode }) {
  const labelId = React.useId();

  return (
    <li role="presentation" data-slot="combobox-group" className={className} {...props}>
      <div
        id={labelId}
        data-slot="combobox-group-label"
        className="text-muted-foreground px-2 py-1.5 text-xs"
      >
        {label}
      </div>
      <ul role="group" aria-labelledby={labelId}>
        {children}
      </ul>
    </li>
  );
}

function ComboboxOption({
  className,
  selected = false,
  active = false,
  children,
  ...props
}: React.ComponentProps<"li"> & {
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
      className={cn(
        "hover:bg-accent hover:text-accent-foreground relative flex min-h-11 cursor-pointer items-center gap-2 rounded-md py-1 pr-8 pl-1.5 text-sm select-none md:min-h-7",
        "data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[active=true]:ring-ring data-[active=true]:ring-2 data-[active=true]:ring-inset",
        className,
      )}
      {...props}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {selected && (
        <CheckIcon
          aria-hidden="true"
          className="absolute top-1/2 right-2 size-4 shrink-0 -translate-y-1/2"
        />
      )}
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

export {
  Combobox,
  ComboboxInput,
  ComboboxList,
  ComboboxGroup,
  ComboboxOption,
  ComboboxEmpty,
  comboboxVariants,
};
