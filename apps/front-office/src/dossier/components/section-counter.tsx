import type { ComponentProps } from "react";
import { CircleAlertIcon, InfoIcon, type LucideIcon } from "lucide-react";

import { Tag } from "@etape/ui/components/tag";

import { selectPlural, type PluralForms } from "@/lib/plural";
import { ERROR_LABELS, REMAINING_FIELD_LABELS, type SectionProgress } from "../domain/statut-volet";

type TagStatus = NonNullable<ComponentProps<typeof Tag>["status"]>;

const COUNTER_KIND = {
  ERREURS: "erreurs",
  RESTANTS: "restants",
} as const;

type CounterKind = (typeof COUNTER_KIND)[keyof typeof COUNTER_KIND];

interface CounterUi {
  Icon: LucideIcon;
  status: TagStatus;
  labels: PluralForms<string>;
  count: (progress: SectionProgress) => number;
}

const COUNTER_UI: Record<CounterKind, CounterUi> = {
  [COUNTER_KIND.ERREURS]: {
    Icon: CircleAlertIcon,
    status: "error",
    labels: ERROR_LABELS,
    count: ({ errorCount }) => errorCount,
  },
  [COUNTER_KIND.RESTANTS]: {
    Icon: InfoIcon,
    status: "primary",
    labels: REMAINING_FIELD_LABELS,
    count: ({ remainingFieldCount }) => remainingFieldCount,
  },
};

/** Les erreurs l'emportent sur les champs restants, comme dans le statut du volet. */
function getCounterKind({ errorCount, remainingFieldCount }: SectionProgress): CounterKind | null {
  if (errorCount > 0) return COUNTER_KIND.ERREURS;
  if (remainingFieldCount > 0) return COUNTER_KIND.RESTANTS;
  return null;
}

export interface SectionCounterProps {
  progress: SectionProgress;
}

export function SectionCounter({ progress }: SectionCounterProps) {
  const kind = getCounterKind(progress);
  if (kind === null) return null;

  const { Icon, status, labels, count } = COUNTER_UI[kind];
  const value = count(progress);

  return (
    <Tag status={status} importance="subdued" size="sm">
      <Icon aria-hidden="true" />
      {value} {selectPlural(value, labels)}
    </Tag>
  );
}
