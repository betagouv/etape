import { InfoIcon } from "lucide-react";

import { selectPlural, type PluralForms } from "@/lib/plural";

const REMAINING_FIELD_LABELS: PluralForms<string> = {
  one: "champ restant",
  other: "champs restants",
};

export function SectionCounter({ remaining }: { remaining: number }) {
  if (remaining === 0) return null;
  return (
    <span className="text-primary flex items-center gap-1 text-xs font-medium">
      <InfoIcon aria-hidden="true" className="size-4" />
      {remaining} {selectPlural(remaining, REMAINING_FIELD_LABELS)}
    </span>
  );
}
