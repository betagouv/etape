"use client";

import * as React from "react";
import { CheckIcon, SearchIcon } from "lucide-react";

import { InputGroup, InputGroupAddon, InputGroupInput } from "@etape/ui/components/input-group";
import { cn } from "@etape/ui/lib/utils";

/*
 * Champ de recherche suivi de sa liste de suggestions, affichée dans le fil de
 * la page (maquette SIMULATEUR-v3, Q7). Apparence du `command` de shadcn ;
 * rôles du motif « combobox » de l'APG W3C, avec une liste à autocomplétion.
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
 * Le focus reste dans le champ : l'option active n'est qu'un focus « virtuel »
 * (`aria-activedescendant`). Écart au kit : elle porte un anneau en plus du fond
 * `accent`, qui ne se distingue pas assez du blanc pour servir d'indicateur de
 * focus.
 */

function Combobox({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="combobox"
      className={cn(
        "bg-popover text-popover-foreground flex w-full flex-col rounded-xl border p-1",
        className,
      )}
      {...props}
    />
  );
}

/** Le champ de recherche, précédé d'une loupe. */
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

function ComboboxOption({
  className,
  selected = false,
  active = false,
  children,
  ...props
}: React.ComponentProps<"li"> & {
  /** Option retenue : cochée, et lue « sélectionnée ». */
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
        "hover:bg-accent hover:text-accent-foreground flex min-h-11 cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm select-none md:min-h-8",
        "data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[active=true]:ring-ring data-[active=true]:ring-2 data-[active=true]:ring-inset",
        className,
      )}
      {...props}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {selected && <CheckIcon aria-hidden="true" className="size-4 shrink-0" />}
    </li>
  );
}

/** Message affiché à la place des options quand aucune ne correspond. */
function ComboboxEmpty({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="combobox-empty"
      className={cn("text-muted-foreground px-3 py-2 text-sm", className)}
      {...props}
    />
  );
}

export { Combobox, ComboboxInput, ComboboxList, ComboboxOption, ComboboxEmpty };
