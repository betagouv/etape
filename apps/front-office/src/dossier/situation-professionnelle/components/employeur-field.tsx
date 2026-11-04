import { useState } from "react";
import { Controller, useWatch, type UseFormReturn } from "react-hook-form";

import { useEmployeurSearch } from "../hooks/use-employeur-search";
import {
  EMPLOYEUR_ENTRY_MODE,
  EMPLOYEUR_FIELDS,
  type EmployeurEntryMode,
  type SituationProfessionnelleFormData,
} from "../schema";
import { EmployeurCard } from "./employeur-card";
import { EmployeurManualFields } from "./employeur-manual-fields";
import { EmployeurSearch } from "./employeur-search";

export interface EmployeurFieldProps {
  form: UseFormReturn<SituationProfessionnelleFormData>;
}

/** La recherche Sirene, la carte de l'établissement choisi, ou la saisie manuelle. */
export function EmployeurField({ form }: EmployeurFieldProps) {
  const { control, setValue, clearErrors } = form;
  const mode = useWatch({ control, name: "employeurEntryMode" });
  const employeur = useWatch({ control, name: "employeur" });
  // Champ, carte et saisie manuelle se remplacent : sans cela, le focus tomberait sur la page.
  const [isFocusRequested, setFocusRequested] = useState(false);

  function switchMode(nextMode: EmployeurEntryMode): void {
    // Quitter un mode efface les erreurs de ses champs.
    clearErrors([...EMPLOYEUR_FIELDS[mode]]);
    setValue("employeurEntryMode", nextMode);
    setFocusRequested(true);
  }

  const search = useEmployeurSearch((etablissement) => {
    setValue("employeur", etablissement, { shouldValidate: true });
    setFocusRequested(true);
  });

  if (mode === EMPLOYEUR_ENTRY_MODE.MANUAL) {
    return (
      <EmployeurManualFields
        control={control}
        isFocusRequested={isFocusRequested}
        onSearch={() => {
          // On repart d'une recherche vide : l'ancienne rouvrirait son alerte « aucun résultat ».
          search.clear();
          switchMode(EMPLOYEUR_ENTRY_MODE.SEARCH);
        }}
      />
    );
  }

  if (employeur) {
    return (
      <EmployeurCard
        etablissement={employeur}
        isFocusRequested={isFocusRequested}
        onChange={() => {
          setValue("employeur", null);
          setFocusRequested(true);
        }}
      />
    );
  }

  return (
    <Controller
      name="employeur"
      control={control}
      render={({ field, fieldState }) => (
        <EmployeurSearch
          search={search}
          fieldRef={field.ref}
          isInvalid={fieldState.invalid}
          error={fieldState.error}
          isFocusRequested={isFocusRequested}
          onManualEntry={() => switchMode(EMPLOYEUR_ENTRY_MODE.MANUAL)}
        />
      )}
    />
  );
}
