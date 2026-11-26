import { InfoIcon } from "lucide-react";

import { Tag } from "@etape/ui/components/tag";

import { FACULTATIF_LABEL } from "../../domain/statut-volet";

/** « Facultatif », en face du titre d'une sous-section de « Mes documents » (maquette, écran 01). */
export function FacultatifTag() {
  return (
    <Tag importance="subdued" size="sm">
      <InfoIcon aria-hidden="true" />
      {FACULTATIF_LABEL}
    </Tag>
  );
}
