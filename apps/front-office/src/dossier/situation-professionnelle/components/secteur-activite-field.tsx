import type { FieldControl } from "../../components/field-control";
import { useSecteurActiviteSearch } from "../hooks/use-secteur-activite-search";
import { SecteurActiviteInput } from "./secteur-activite-input";

/** Ce que reçoit `SecteurActiviteField` : le champ du formulaire et son erreur. */
export interface SecteurActiviteFieldProps {
  /** La valeur est le code NAF du secteur. */
  field: FieldControl<HTMLInputElement>;
  error?: { message?: string };
}

/** Le secteur d'activité de l'employeur saisi à la main : la recherche dans la NAF, et son champ. */
export function SecteurActiviteField({ field, error }: SecteurActiviteFieldProps) {
  const search = useSecteurActiviteSearch(field.value, field.onChange);

  return (
    <SecteurActiviteInput
      search={search}
      value={field.value}
      fieldRef={field.ref}
      onBlur={field.onBlur}
      error={error}
    />
  );
}
