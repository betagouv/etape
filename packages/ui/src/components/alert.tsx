import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@etape/ui/lib/utils";

/*
 * Encart de message posé dans le fil de la page. Source shadcn `alert`, aux
 * marges du kit Figma (10 × 8).
 *
 * Écarts à shadcn :
 * - pas de `role="alert"` imposé. Une région ajoutée au DOM en même temps que
 *   son texte n'est pas annoncée de façon fiable : l'annonce passe par une
 *   région `role="status"` déjà montée, que l'écran choisit
 *   (`docs/conventions/accessibilite.md`) ;
 * - le titre n'est pas tronqué à une ligne : à 200 % de zoom, il doit pouvoir
 *   passer à la ligne ;
 * - la description `destructive` garde la couleur pleine : à 90 %, elle
 *   perdrait le contraste de 4,5:1.
 */
const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-2.5 py-2 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-2 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive: "bg-card text-destructive *:data-[slot=alert-description]:text-destructive",
        // Variante ETAPE (maquette SIMULATEUR-v3, Q4) : un résultat calculé à
        // partir de la saisie, mis en avant par un filet à gauche.
        emphasis:
          "bg-secondary text-primary rounded-l-none rounded-r-md border-0 border-l-3 border-l-primary px-3 font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div data-slot="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("col-start-2 min-h-4 font-medium", className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
