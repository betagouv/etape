import { Controller, type Control } from "react-hook-form";
import { SearchIcon } from "lucide-react";

import { Button } from "@etape/ui/components/button";
import { FormField } from "@etape/ui/components/form-field";
import { Input } from "@etape/ui/components/input";

import {
  SITUATION_PROFESSIONNELLE_FIELD_LABEL,
  type SituationProfessionnelleFormData,
} from "../schema";
import { SecteurActiviteInput } from "./secteur-activite-input";

export interface EmployeurManualFieldsProps {
  control: Control<SituationProfessionnelleFormData>;
  /** Vrai à l'ouverture depuis la recherche : le focus passe au premier champ, la recherche ayant disparu. */
  isFocusRequested: boolean;
  onSearch: () => void;
}

/** L'employeur saisi à la main, quand la recherche Sirene ne le trouve pas ou ne répond pas. */
export function EmployeurManualFields({
  control,
  isFocusRequested,
  onSearch,
}: EmployeurManualFieldsProps) {
  return (
    <div className="flex flex-col gap-5">
      <FormField
        name="denomination"
        control={control}
        label={SITUATION_PROFESSIONNELLE_FIELD_LABEL.denomination}
        required
        description="Tel qu’il figure sur votre bulletin de salaire"
        render={({ field, attributes }) => (
          <Input {...field} {...attributes} autoFocus={isFocusRequested} />
        )}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          name="siret"
          control={control}
          label={SITUATION_PROFESSIONNELLE_FIELD_LABEL.siret}
          required
          description="Les 14 chiffres qui figurent sur votre bulletin de salaire"
          render={({ field, attributes }) => (
            <Input {...field} {...attributes} inputMode="numeric" />
          )}
        />

        <Controller
          name="secteurActivite"
          control={control}
          render={({ field, fieldState }) => (
            <SecteurActiviteInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              fieldRef={field.ref}
              isInvalid={fieldState.invalid}
              error={fieldState.error}
            />
          )}
        />
      </div>

      <FormField
        name="adresse"
        control={control}
        label={SITUATION_PROFESSIONNELLE_FIELD_LABEL.adresse}
        required
        description="Telle qu’elle figure sur votre bulletin de salaire"
        render={({ field, attributes }) => <Input {...field} {...attributes} />}
      />

      <Button type="button" variant="link" size="inline" className="self-start" onClick={onSearch}>
        <SearchIcon aria-hidden="true" />
        Rechercher dans l’annuaire des entreprises
      </Button>
    </div>
  );
}
