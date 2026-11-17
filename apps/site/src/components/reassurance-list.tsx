import { cn } from "@etape/ui/lib/utils";

import type { ReassuranceItem } from "@/content/home";

const REASSURANCE_VARIANT = {
  GRID: "grid",
  INLINE: "inline",
} as const;

type ReassuranceVariant = (typeof REASSURANCE_VARIANT)[keyof typeof REASSURANCE_VARIANT];

const LIST_CLASS: Record<ReassuranceVariant, string> = {
  [REASSURANCE_VARIANT.GRID]: "gap-x-4 gap-y-8 lg:gap-x-12",
  // `Réassurance / Items` : `Gap/3XL` (48) en colonne, `Gap/M` (12) en ligne.
  [REASSURANCE_VARIANT.INLINE]: "gap-x-12 gap-y-3",
};

const ITEM_CLASS: Record<ReassuranceVariant, string> = {
  // Largeurs de la maquette : 150px en mobile, 160px en desktop.
  [REASSURANCE_VARIANT.GRID]:
    "text-primary text-label-lg basis-32 flex-col gap-3 text-center font-semibold lg:basis-40",
  // `Caption/Default` (12/16) en `Content/Secondary`, et `Gap/S` (8).
  [REASSURANCE_VARIANT.INLINE]: "text-content-secondary gap-2 text-xs",
};

const ICON_CLASS: Record<ReassuranceVariant, string> = {
  [REASSURANCE_VARIANT.GRID]: "text-primary size-6",
  [REASSURANCE_VARIANT.INLINE]: "size-4",
};

export function ReassuranceList({
  items,
  variant = REASSURANCE_VARIANT.GRID,
  className,
}: {
  items: readonly ReassuranceItem[];
  variant?: ReassuranceVariant;
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap justify-center", LIST_CLASS[variant], className)}>
      {items.map(({ icon: Icon, label }) => (
        <li key={label} className={cn("flex items-center", ITEM_CLASS[variant])}>
          <Icon aria-hidden="true" focusable="false" className={ICON_CLASS[variant]} />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}
