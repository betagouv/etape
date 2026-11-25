import type { ComponentProps } from "react";
import { CircleAlertIcon, InfoIcon, type LucideIcon } from "lucide-react";

import { Tag } from "@etape/ui/components/tag";

import { selectPlural, type PluralForms } from "@/lib/plural";
import {
  ERROR_LABELS,
  PROGRESS_UNIT,
  REMAINING_LABELS,
  STATUT_VOLET,
  type ProgressUnit,
  type SectionProgress,
} from "../domain/statut-volet";

type TagStatus = NonNullable<ComponentProps<typeof Tag>["status"]>;

/** Les deux statuts du volet qu'une section reprend ; complète, elle n'affiche rien. */
type CounterStatut = typeof STATUT_VOLET.A_CORRIGER | typeof STATUT_VOLET.EN_COURS;

interface CounterUi {
  Icon: LucideIcon;
  status: TagStatus;
  labels: Record<ProgressUnit, PluralForms<string>>;
  count: (progress: SectionProgress) => number;
}

const COUNTER_UI: Record<CounterStatut, CounterUi> = {
  [STATUT_VOLET.A_CORRIGER]: {
    Icon: CircleAlertIcon,
    status: "error",
    labels: { [PROGRESS_UNIT.FIELD]: ERROR_LABELS, [PROGRESS_UNIT.DOCUMENT]: ERROR_LABELS },
    count: ({ errorCount }) => errorCount,
  },
  [STATUT_VOLET.EN_COURS]: {
    Icon: InfoIcon,
    status: "primary",
    labels: REMAINING_LABELS,
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

/** Ce que reçoit `SectionCounter` : l'avancement de la section, et ce qu'elle compte. */
export interface SectionCounterProps {
  progress: SectionProgress;
  unit?: ProgressUnit;
}

/** Champs ou documents restants, ou erreurs, d'une section du volet ; rien quand elle est complète. */
export function SectionCounter({ progress, unit = PROGRESS_UNIT.FIELD }: SectionCounterProps) {
  const statut = getCounterStatut(progress);
  if (statut === null) return null;

  const { Icon, status, labels, count } = COUNTER_UI[statut];
  const value = count(progress);

  return (
    <Tag status={status} importance="subdued" size="sm">
      <Icon aria-hidden="true" />
      {value} {selectPlural(value, labels[unit])}
    </Tag>
  );
}
