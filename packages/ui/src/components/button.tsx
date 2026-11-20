import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@etape/ui/lib/utils";

/*
 * `cursor-pointer` est explicite : le preflight de Tailwind v4 laisse aux
 * boutons le curseur par défaut du navigateur, soit la flèche. Les boutons
 * désactivés n'en héritent pas, `disabled:pointer-events-none` les mettant hors
 * de portée du pointeur.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress aria-disabled:not-aria-busy:cursor-not-allowed aria-disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:not-aria-disabled:bg-primary/90",
        // Le kit tel quel : libellé à 4,14:1 sur ce fond, correction attendue dans le kit (#106).
        destructive:
          "bg-destructive/10 text-destructive hover:not-aria-disabled:bg-destructive/20 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:not-aria-disabled:bg-destructive/30",
        "destructive-subdued": "text-destructive",
        outline:
          "border bg-background text-secondary-foreground hover:not-aria-disabled:bg-secondary dark:border-input dark:bg-input/30 dark:hover:not-aria-disabled:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:not-aria-disabled:bg-secondary/80",
        ghost: "text-secondary-foreground hover:not-aria-disabled:bg-secondary",
        link: "text-primary underline underline-offset-4",
      },
      size: {
        // Tailles du kit (`Size=SM`, `MD (default)`, `LG`) : 32, 40 et 48 px.
        sm: "h-8 gap-1 rounded-md px-3 text-sm [&_svg:not([class*='size-'])]:size-5",
        default: "h-10 gap-2 rounded-lg px-4 text-base [&_svg:not([class*='size-'])]:size-5",
        lg: "h-12 gap-2 rounded-lg px-6 text-xl [&_svg:not([class*='size-'])]:size-6",
        // `LG` du kit sous 768 px, `MD` au-delà : les maquettes mobiles du simulateur.
        responsive:
          "h-12 gap-2 rounded-lg px-6 text-xl md:h-10 md:px-4 md:text-base [&_svg:not([class*='size-'])]:size-6 md:[&_svg:not([class*='size-'])]:size-5",
        // `Size=Icon SM`, `Icon MD (default)`, `Icon LG` du kit.
        "icon-sm": "size-8 rounded-md",
        icon: "size-10 rounded-lg [&_svg:not([class*='size-'])]:size-5",
        "icon-lg": "size-12 rounded-lg [&_svg:not([class*='size-'])]:size-6",
      },
      // Extension ETAPE, hors kit : un libellé plus large que son conteneur passe à la ligne.
      // Le kit le garde sur une ligne, et aucune maquette mobile ne montre un libellé aussi long.
      multiline: {
        true: "h-auto text-left whitespace-normal",
        false: null,
      },
    },
    compoundVariants: [
      // `Variant=Link` du kit : les hauteurs des autres variantes, sans padding.
      { variant: "link", class: "px-0" },
      { variant: "link", size: ["default", "lg"], class: "gap-1.5" },
      // Sur une ligne, un bouton `multiline` garde la hauteur du kit.
      { multiline: true, size: "sm", class: "min-h-8" },
      { multiline: true, size: "default", class: "min-h-10" },
      { multiline: true, size: "lg", class: "min-h-12" },
      { multiline: true, size: "responsive", class: "min-h-12 md:h-auto md:min-h-10" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      multiline: false,
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  multiline = false,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, multiline, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
