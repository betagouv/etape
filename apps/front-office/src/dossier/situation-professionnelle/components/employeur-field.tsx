import { useState } from "react";
import type { Etablissement } from "@etape/api-contract";

import { useEmployeurSearch } from "../hooks/use-employeur-search";
import { EmployeurCard } from "./employeur-card";
import { EmployeurSearch } from "./employeur-search";

export interface EmployeurFieldProps {
  value: Etablissement | null;
  onChange: (value: Etablissement | null) => void;
  fieldRef: React.Ref<HTMLInputElement>;
  isInvalid: boolean;
  error?: { message?: string };
}

/** La recherche tant qu'aucun employeur n'est choisi, puis sa carte. */
export function EmployeurField({
  value,
  onChange,
  fieldRef,
  isInvalid,
  error,
}: EmployeurFieldProps) {
  // Le champ et la carte se remplacent : sans cela, le focus tomberait sur la page.
  const [isFocusRequested, setFocusRequested] = useState(false);
  const search = useEmployeurSearch((etablissement) => {
    onChange(etablissement);
    setFocusRequested(true);
  });

  if (value) {
    return (
      <EmployeurCard
        etablissement={value}
        isFocusRequested={isFocusRequested}
        onChange={() => {
          onChange(null);
          setFocusRequested(true);
        }}
      />
    );
  }

  return (
    <EmployeurSearch
      search={search}
      fieldRef={fieldRef}
      isInvalid={isInvalid}
      error={error}
      isFocusRequested={isFocusRequested}
    />
  );
}
