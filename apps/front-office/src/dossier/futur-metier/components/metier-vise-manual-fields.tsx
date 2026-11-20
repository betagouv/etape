import type { Control } from "react-hook-form";
import { SearchIcon } from "lucide-react";

import { Button } from "@etape/ui/components/button";
import { FormField } from "@etape/ui/components/form-field";
import { Input } from "@etape/ui/components/input";

import { formatCodeRome } from "../domain/format-code-rome";
import { FUTUR_METIER_FIELD_LABEL, type FuturMetierFormData } from "../schema";

/** Ce que reçoit `MetierViseManualFields` : le contrôle du formulaire et le retour à la recherche. */
export interface MetierViseManualFieldsProps {
  control: Control<FuturMetierFormData>;
  /** Vrai à l'ouverture depuis la recherche : le focus passe au premier champ, la recherche ayant disparu. */
  isFocusRequested: boolean;
  onSearch: () => void;
}

/** Le métier visé saisi à la main, quand la recherche dans le ROME ne le trouve pas ou ne répond pas. */
export function MetierViseManualFields({
  control,
  isFocusRequested,
  onSearch,
}: MetierViseManualFieldsProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          name="intituleMetierVise"
          control={control}
          label={FUTUR_METIER_FIELD_LABEL.intituleMetierVise}
          required
          render={({ field, attributes }) => (
            <Input {...field} {...attributes} autoFocus={isFocusRequested} />
          )}
        />

        <FormField
          name="codeRome"
          control={control}
          label={FUTUR_METIER_FIELD_LABEL.codeRome}
          render={({ field, attributes }) => (
            <Input
              {...field}
              {...attributes}
              // Mis en forme à la sortie : réécrire la saisie à chaque frappe renverrait le curseur en fin de champ.
              onBlur={() => {
                field.onChange(formatCodeRome(field.value));
                field.onBlur();
              }}
            />
          )}
        />
      </div>

      <Button
        type="button"
        variant="link"
        size="lg"
        multiline
        className="self-start"
        onClick={onSearch}
      >
        <SearchIcon aria-hidden="true" />
        Rechercher le métier dans le référentiel ROME de France Travail
      </Button>
    </div>
  );
}
