import type { ComponentProps } from "react";
import { CircleAlertIcon, InfoIcon, type LucideIcon } from "lucide-react";

import { Tag } from "@etape/ui/components/tag";

import { selectPlural, type PluralForms } from "@/lib/plural";
import { ERROR_LABELS, REMAINING_FIELD_LABELS, STATUT_VOLET } from "../../domain/statut-volet";
import type { SectionProgress } from "../hooks/use-informations-form";

type TagStatus = NonNullable<ComponentProps<typeof Tag>["status"]>;

/** Les deux statuts du volet qu'une section reprend ; complète, elle n'affiche rien. */
type CounterStatut = typeof STATUT_VOLET.A_CORRIGER | typeof STATUT_VOLET.EN_COURS;

interface CounterUi {
  Icon: LucideIcon;
  status: TagStatus;
  labels: PluralForms<string>;
  count: (progress: SectionProgress) => number;
}

const COUNTER_UI: Record<CounterStatut, CounterUi> = {
  [STATUT_VOLET.A_CORRIGER]: {
    Icon: CircleAlertIcon,
    status: "error",
    labels: ERROR_LABELS,
    count: ({ errorCount }) => errorCount,
  },
  [STATUT_VOLET.EN_COURS]: {
    Icon: InfoIcon,
    status: "primary",
    labels: REMAINING_FIELD_LABELS,
    count: ({ remainingFieldCount }) => remainingFieldCount,
  },
};

/** Les erreurs l'emportent sur les champs restants, comme dans le statut du volet. */
function getCounterStatut({
  errorCount,
  remainingFieldCount,
}: SectionProgress): CounterStatut | null {
  if (errorCount > 0) return STATUT_VOLET.A_CORRIGER;
  if (remainingFieldCount > 0) return STATUT_VOLET.EN_COURS;
  return null;
}

export interface SectionCounterProps {
  progress: SectionProgress;
}

export function SectionCounter({ progress }: SectionCounterProps) {
  const statut = getCounterStatut(progress);
  if (statut === null) return null;

  const { Icon, status, labels, count } = COUNTER_UI[statut];
  const value = count(progress);

  return (
    <Tag status={status} importance="subdued" size="sm">
      <Icon aria-hidden="true" />
      {value} {selectPlural(value, labels)}
    </Tag>
  );
}
