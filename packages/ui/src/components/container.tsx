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
/*
 * Les cotes Figma sont des conséquences, pas des cibles : les maquettes font
 * 1440 de large et chaque bloc applique une gouttière prise dans les tokens de
 * padding. Mesuré sur « Desktop - Home » — l'en-tête est volontairement plus
 * large que le reste (logo à x=96, contenu des sections à x=128) :
 *
 *   en-tête                  1440 − 2 × `Padding/5XL` (96)  = 1248
 *   sections et pied de page 1440 − 2 × `Padding/6XL` (128) = 1184
 *   bandes teal              1440 − 2 × `Padding/8XL` (256) =  928
 *
 * `max-width` s'appliquant à la boîte de bordure, chaque palier vaut « contenu
 * + 2 gouttières de 32px » : c'est ce décalage qui fait qu'à 1440 la marge
 * effective retombe sur celle du token. On plafonne là, pour ne pas produire de
 * longueurs de ligne que le design n'a jamais validées.
 */
const containerVariants = cva("mx-auto w-full px-4 sm:px-6 lg:px-8", {
  variants: {
    size: {
      /** Largeur de lecture, sans équivalent dans les maquettes. */
      sm: "max-w-2xl",
      /** 928 de contenu — sections en `Padding/8XL`. */
      md: "max-w-[62rem]",
      /** 1184 de contenu — sections et pied de page, en `Padding/6XL`. */
      lg: "max-w-[78rem]",
      /** 1248 de contenu — en-tête seul, en `Padding/5XL`. */
      xl: "max-w-[82rem]",
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

/** Largeurs de contenu disponibles, pour les composants qui délèguent à `Container`. */
export type ContainerSize = NonNullable<VariantProps<typeof containerVariants>["size"]>;

export { Container, containerVariants };
