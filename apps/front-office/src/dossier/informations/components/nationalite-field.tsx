import { useNationaliteSearch } from "../hooks/use-nationalite-search";
import { NationaliteInput } from "./nationalite-input";

/** Ce que fournit le `field` d'un `Controller` de react-hook-form. */
export interface NationaliteFieldControl {
  value: string;
  onChange: (code: string) => void;
  onBlur: () => void;
  ref: React.Ref<HTMLButtonElement>;
}

export interface NationaliteFieldProps {
  field: NationaliteFieldControl;
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
