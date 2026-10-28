import type { ComponentProps } from "react";

import { cn } from "@etape/ui/lib/utils";

export interface BrandMarkProps extends ComponentProps<"span"> {
  /** Le produit nommé après la marque : « Espace bénéficiaire », « Simulateur d’éligibilité ». */
  product?: string;
}

/**
 * La marque des barres d'en-tête, « etape. » suivi du produit. Elle ne porte ni
 * lien ni focus : l'app qui en fait un lien l'enveloppe, avec `focusRing`.
 */
export function BrandMark({ product, className, ...props }: BrandMarkProps) {
  return (
    <span
      data-slot="brand-mark"
      className={cn("flex flex-wrap items-baseline gap-x-2", className)}
      {...props}
    >
      <span className="font-heading text-heading-sm text-primary">etape.</span>
      {product && <span className="text-body text-foreground font-semibold">{product}</span>}
    </span>
  );
}
