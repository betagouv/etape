"use client";

import * as React from "react";

import { InputGroup, InputGroupAddon, InputGroupTextarea } from "@etape/ui/components/input-group";

interface CharacterCountTextareaProps extends React.ComponentProps<"textarea"> {
  /** Le compteur tel qu'il s'affiche (« 12/1000 caractères ») : l'app le met en forme. */
  countLabel: string;
  /** Le compteur tel qu'il se lit (« 12 caractères sur 1000 ») : la barre oblique du texte affiché peut être épelée. */
  countAnnouncement: string;
  /** Mise en page seulement : largeur, marge. */
  className?: string;
}

/**
 * Zone de texte dont le cadre porte un compteur de caractères : `Field` de type Textarea
 * de la maquette FRONT-OFFICE. La limite est celle de `maxLength`, que le navigateur applique.
 *
 * Le compteur s'ajoute à la description du champ : il est lu à l'entrée dans le champ,
 * pas à chaque frappe, et sous sa forme `countAnnouncement`. Dans un `FormField` :
 * `render={({ field, attributes }) => <CharacterCountTextarea {...field} {...attributes} … />}`.
 */
function CharacterCountTextarea({
  countLabel,
  countAnnouncement,
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
        <span id={countId}>
          <span aria-hidden="true">{countLabel}</span>
          <span className="sr-only">{countAnnouncement}</span>
        </span>
      </InputGroupAddon>
    </InputGroup>
  );
}

export { CharacterCountTextarea };
export type { CharacterCountTextareaProps };
