import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@etape/ui/lib/utils";

/**
 * Fond pleine largeur sous un écran, sans marge ni conteneur : là où `Section`, avec son
 * espacement et son `Container`, ne convient pas. L'app n'y ajoute que de la mise en page.
 */
const surfaceVariants = cva("", {
  variants: {
    surface: {
      /** Le fond de page du dossier, dont le cadre blanc du volet se détache (maquette FRONT-OFFICE). */
      page: "bg-surface-page",
    },
  },
  defaultVariants: {
    surface: "page",
  },
});

function Surface({
  className,
  surface,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof surfaceVariants>) {
  return (
    <div
      data-slot="surface"
      data-surface={surface}
      className={cn(surfaceVariants({ surface }), className)}
      {...props}
    />
  );
}

export { Surface, surfaceVariants };
