"use client";

import { Checkbox } from "@etape/ui/components/checkbox";
import { Label } from "@etape/ui/components/label";

import type { ToggleField as ToggleFieldDef } from "../../domain/types";
import { joinIds } from "./aria";

interface ToggleFieldProps {
  field: ToggleFieldDef;
  value: boolean;
  onChange: (value: boolean) => void;
  describedBy?: string;
}

/**
 * Case à cocher unique. Contrairement à `CheckboxField`, elle ne choisit pas
 * dans une liste : elle porte une seule affirmation, et son libellé est son nom
 * accessible. Décochée est une réponse — le champ n'est jamais « incomplet ».
 */
export function ToggleField({ field, value, onChange, describedBy }: ToggleFieldProps) {
  const hintId = field.hint ? `${field.name}-hint` : undefined;

  return (
    <div className="flex w-full flex-col gap-1">
      {/* Zone cliquable limitée à la case et à son texte : sur toute la largeur,
          un clic dans le vide pour quitter le champ voisin cochait la case. */}
      <Label
        htmlFor={field.name}
        className="min-h-11 w-fit max-w-full cursor-pointer items-start gap-2 md:min-h-0"
      >
        {/* Case et libellé du kit (maquette Q5) : 16 px, libellé en medium. */}
        <Checkbox
          id={field.name}
          checked={value}
          onCheckedChange={(state) => onChange(state === true)}
          aria-describedby={joinIds(hintId, describedBy)}
          // Centrée sur la première ligne du libellé, de 20 px.
          className="mt-0.5"
        />
        <span className="text-foreground text-sm font-medium">{field.label}</span>
      </Label>
      {field.hint && (
        <p id={hintId} className="text-content-secondary ps-6 text-sm leading-5">
          {field.hint}
        </p>
      )}
    </div>
  );
}
