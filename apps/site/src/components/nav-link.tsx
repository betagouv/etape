import * as React from "react";
import Link from "next/link";

import { focusRing } from "@etape/ui/lib/focus";
import { cn } from "@etape/ui/lib/utils";

/**
 * Entrée de la navigation principale — pendant en code du composant
 * `ItemNavBar` de la maquette Figma.
 *
 * Deux états seulement, conformes à la maquette : courant (accentué et gras) ou
 * par défaut. Le survol souligne le libellé sans en changer la graisse, afin
 * qu'aucun décalage de mise en page ne se produise au passage de la souris.
 */
export function NavLink({
  isCurrent = false,
  className,
  ...props
}: React.ComponentProps<typeof Link> & {
  /** Marque l'entrée comme page affichée (`aria-current="page"`). */
  isCurrent?: boolean;
}) {
  return (
    <Link
      aria-current={isCurrent ? "page" : undefined}
      className={cn(
        "inline-block rounded-sm py-2 leading-6 transition-colors",
        focusRing,
        isCurrent
          ? "text-content-accent font-bold"
          : "text-foreground hover:text-content-accent hover:underline hover:underline-offset-4",
        className,
      )}
      {...props}
    />
  );
}
