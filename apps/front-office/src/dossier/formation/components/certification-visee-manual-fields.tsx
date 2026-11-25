import type { Control } from "react-hook-form";
import { SearchIcon } from "lucide-react";

import { Button } from "@etape/ui/components/button";
import { FormField } from "@etape/ui/components/form-field";
import { FormSelect } from "@etape/ui/components/form-select";
import { Input } from "@etape/ui/components/input";

import { formatNumeroFiche } from "../domain/format-numero-fiche";
import { NIVEAU_CERTIFICATION_LABEL } from "../domain/niveau-certification";
import { FORMATION_FIELD, FORMATION_FIELD_LABEL, type FormationFormData } from "../schema";

/** Ce que reçoit `CertificationViseeManualFields` : le contrôle du formulaire et le retour à la recherche. */
export interface CertificationViseeManualFieldsProps {
  control: Control<FormationFormData>;
  /** Vrai à l'ouverture depuis la recherche : le focus passe au premier champ, la recherche ayant disparu. */
  isFocusRequested: boolean;
  onSearch: () => void;
}

/** Le diplôme saisi à la main, quand la recherche dans les répertoires ne le trouve pas ou ne répond pas (maquettes 07 à 09). */
export function CertificationViseeManualFields({
  control,
  isFocusRequested,
  onSearch,
}: CertificationViseeManualFieldsProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          name={FORMATION_FIELD.INTITULE_CERTIFICATION_VISEE}
          control={control}
          label={FORMATION_FIELD_LABEL.intituleCertificationVisee}
          required
          render={({ field, attributes }) => (
            <Input {...field} {...attributes} autoFocus={isFocusRequested} />
          )}
        />

        <FormField
          name={FORMATION_FIELD.NUMERO_FICHE}
          control={control}
          label={FORMATION_FIELD_LABEL.numeroFiche}
          render={({ field, attributes }) => (
            <Input
              {...field}
              {...attributes}
              // Mis en forme à la sortie : réécrire la saisie à chaque frappe renverrait le curseur en fin de champ.
              onBlur={() => {
                field.onChange(formatNumeroFiche(field.value));
                field.onBlur();
              }}
            />
          )}
        />
      </div>

      <FormSelect
        name={FORMATION_FIELD.NIVEAU_CERTIFICATION}
        control={control}
        label={FORMATION_FIELD_LABEL.niveauCertification}
        options={NIVEAU_CERTIFICATION_LABEL}
      />

      <Button
        type="button"
        variant="link"
        size="lg"
        multiline
        className="self-start"
        onClick={onSearch}
      >
        <SearchIcon aria-hidden="true" />
        Rechercher dans les répertoires RNCP et RS
      </Button>
    </div>
  );
}
