"use client";

import * as React from "react";

import { InputGroup, InputGroupAddon, InputGroupTextarea } from "@etape/ui/components/input-group";

interface CharacterCountTextareaProps extends React.ComponentProps<"textarea"> {
  /** Le compteur tel qu'il s'affiche (« 12/1000 caractères ») : l'app le met en forme. */
  countLabel: string;
  /** Mise en page seulement : largeur, marge. */
  className?: string;
}

/**
 * Zone de texte dont le cadre porte un compteur de caractères : `Field` de type Textarea
 * de la maquette FRONT-OFFICE. La limite est celle de `maxLength`, que le navigateur applique.
 *
 * Le compteur s'ajoute à la description du champ : il est lu à l'entrée dans le champ,
 * pas à chaque frappe. Dans un `FormField` :
 * `render={({ field, attributes }) => <CharacterCountTextarea {...field} {...attributes} … />}`.
 */
function CharacterCountTextarea({
  countLabel,
  className,
  "aria-describedby": describedBy,
  ...props
}: CharacterCountTextareaProps) {
  const countId = React.useId();

  return (
    <InputGroup data-slot="character-count-textarea" className={className}>
      <InputGroupTextarea
        aria-describedby={describedBy ? `${describedBy} ${countId}` : countId}
        {...props}
      />
      <InputGroupAddon align="block-end">
        <span id={countId}>{countLabel}</span>
      </InputGroupAddon>
    </InputGroup>
  );
}

export { CharacterCountTextarea };
export type { CharacterCountTextareaProps };
