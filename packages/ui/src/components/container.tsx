import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@etape/ui/lib/utils";

/**
 * Conteneur de mise en page centré et à largeur bornée.
 *
 * Factorise le motif répété `mx-auto w-full max-w-* px-*` des pages.
 * Le responsive reste porté par le CSS (padding fluide via breakpoints) ;
 * ce composant n'encapsule que la largeur/centrage, pas de logique JS.
 *
 * Utiliser `asChild` pour projeter ces styles sur un élément sémantique
 * (ex. `<main>`, `<section>`, `<header>`).
 */
const containerVariants = cva("mx-auto w-full px-6 sm:px-8", {
  variants: {
    size: {
      sm: "max-w-2xl",
      md: "max-w-4xl",
      lg: "max-w-6xl",
      full: "max-w-none",
    },
  },
  defaultVariants: {
    size: "lg",
  },
});

function Container({
  className,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof containerVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp data-slot="container" className={cn(containerVariants({ size }), className)} {...props} />
  );
}

export { Container, containerVariants };
