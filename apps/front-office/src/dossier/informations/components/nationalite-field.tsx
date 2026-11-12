import type { FieldControl } from "../../components/field-control";
import { useNationaliteSearch } from "../hooks/use-nationalite-search";
import { NationaliteInput } from "./nationalite-input";

/** Ce que reçoit `NationaliteField` : le champ du formulaire et son erreur. */
export interface NationaliteFieldProps {
  /** La valeur est le code de la nationalité. */
  field: FieldControl<HTMLButtonElement>;
  error?: { message?: string };
}

/** La nationalité du bénéficiaire : la recherche dans la liste, et son champ. */
export function NationaliteField({ field, error }: NationaliteFieldProps) {
  const search = useNationaliteSearch(field.value, field.onChange);

  return (
    <NationaliteInput
      search={search}
      value={field.value}
      fieldRef={field.ref}
      onBlur={field.onBlur}
      error={error}
    />
  );
}
