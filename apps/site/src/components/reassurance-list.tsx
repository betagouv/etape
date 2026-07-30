import { cn } from "@etape/ui/lib/utils";

import type { ReassuranceItem } from "@/content/home";

/**
 * Liste des arguments de réassurance (gratuit, anonyme, sans dossier…).
 *
 * Deux présentations dans les maquettes, d'où les deux variantes :
 * - `grid` : icône au-dessus du libellé, en teal, pour la section
 *   « Une démarche simple et sécurisée ». Cinq items en ligne en desktop, qui se
 *   replient naturellement en 2 + 2 + 1 centré en mobile grâce au `flex-wrap`.
 * - `inline` : icône à gauche, texte gris compact, pour le bandeau sous le CTA final.
 *
 * Le libellé est toujours présent en texte : l'icône ne porte aucune
 * information et reste donc `aria-hidden`.
 */
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
        variant === "grid" ? "gap-x-4 gap-y-8 lg:gap-x-12" : "gap-x-6 gap-y-3 lg:gap-x-8",
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
                // Le `flex-wrap` du parent en déduit tout seul les cinq items en
                // ligne en desktop, et 2 + 2 + 1 centré en mobile.
                "text-primary text-label-lg basis-32 flex-col gap-3 text-center font-semibold lg:basis-40"
              : "text-muted-foreground text-body-sm gap-2",
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
