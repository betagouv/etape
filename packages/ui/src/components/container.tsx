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
 * Modèle de largeur — dérivé de la façon dont les maquettes sont construites.
 *
 * Les cotes Figma ne sont pas des largeurs cibles, ce sont des conséquences :
 * les maquettes sont dessinées pour 1440px, et chaque bloc applique une
 * gouttière prise dans les tokens de padding. Mesuré sur le cadre
 * « Desktop - Home » :
 *
 *   en-tête                  1440 − 2 × `Padding/5XL` (96)  = 1248 de contenu
 *   sections et pied de page 1440 − 2 × `Padding/6XL` (128) = 1184 de contenu
 *   bandes « saviez-vous » / « pour qui »
 *                            1440 − 2 × `Padding/8XL` (256) =  928 de contenu
 *   mobile                    390 − 2 × `Padding/XL`  (16)  =  358 de contenu
 *
 * L'en-tête est donc volontairement un peu plus large que le reste : sur
 * l'instance `Navbar` de la page, le logo est à x=96 et le bloc de droite
 * s'arrête à 1344, là où les colonnes du pied de page et les `_InnerContent` des
 * sections commencent à x=128. Deux paliers distincts sont nécessaires.
 *
 * On borne à la résolution de référence : en dessous de 1440 la largeur est
 * fluide, à 1440 le rendu est exactement celui de la maquette, au-delà on ne
 * grandit plus — pour ne pas produire de longueurs de ligne que le design n'a
 * jamais validées (le chapô de « Mesurer notre impact » dépasserait les 200
 * caractères sur un écran large).
 *
 * `max-width` s'appliquant à la boîte de bordure, chaque palier vaut
 * « contenu de référence + 2 gouttières de 32px ». C'est ce décalage qui fait
 * qu'à 1440 la marge effective retombe sur celle du token.
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
