import { cn } from "@etape/ui/lib/utils";

import type { ReassuranceItem } from "@/content/home";

export function ReassuranceList({
  items,
  variant = "grid",
  className,
}: {
  items: readonly ReassuranceItem[];
  variant?: "grid" | "inline";
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "flex flex-wrap justify-center",
        variant === "grid"
          ? "gap-x-4 gap-y-8 lg:gap-x-12"
          : // `Réassurance / Items` : `Gap/3XL` (48) en colonne, `Gap/M` (12) en ligne.
            "gap-x-12 gap-y-3",
        className,
      )}
    >
      {items.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className={cn(
            "flex items-center",
            variant === "grid"
              ? // Largeurs de la maquette : 150px en mobile, 160px en desktop.
                "text-primary text-label-lg basis-32 flex-col gap-3 text-center font-semibold lg:basis-40"
              : // `Caption/Default` (12/16) en `Content/Secondary`, et `Gap/S` (8).
                "text-content-secondary text-caption gap-2",
          )}
        >
          <Icon
            aria-hidden="true"
            focusable="false"
            className={variant === "grid" ? "text-primary size-6" : "size-4"}
          />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}
