import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { descendantLinksFocusRing } from "@etape/ui/lib/focus";
import { cn } from "@etape/ui/lib/utils";

/*
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
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-2.5 py-2 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-2 sm:has-[>[data-placement=end]]:items-center sm:has-[>[data-placement=end]]:grid-cols-[calc(var(--spacing)*4)_1fr_auto] sm:[&:has(>[data-slot=alert-description])>[data-placement=end]]:row-[1/span_2] [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current sm:[&:has(>[data-placement=end])>svg]:translate-y-0",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive: "bg-card text-destructive *:data-[slot=alert-description]:text-destructive",
        emphasis:
          "bg-secondary text-primary rounded-l-none rounded-r-md border-0 border-l-3 border-l-primary px-3 font-medium",
        info: "border-info-border bg-info-muted text-info-text *:data-[slot=alert-description]:text-accent-foreground",
        /** `Variant=Warning` du kit. */
        warning:
          "border-warning-border bg-warning-muted text-warning-text *:data-[slot=alert-description]:text-accent-foreground",
        "destructive-subdued":
          "border-destructive-border bg-destructive-muted text-destructive-text *:data-[slot=alert-description]:text-accent-foreground",
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
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_a]:underline",
        descendantLinksFocusRing,
        className,
      )}
      {...props}
    />
  );
}

const alertActionsVariants = cva("col-span-full mt-1.5 flex flex-wrap items-center gap-2", {
  variants: {
    placement: {
      /** Sous le texte, alignés sur le bord gauche de l'alerte et à 8 px du texte, comme dans le kit. */
      below: "",
      /**
       * À droite du texte, centrés sur le titre et sa description ; sous le texte quand la place
       * manque (maquette FRONT-OFFICE, « Mes documents », écran 05). Suppose l'icône de l'alerte.
       */
      end: "sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:mt-0 sm:self-center",
    },
  },
  defaultVariants: {
    placement: "below",
  },
});

/** Les boutons de l'alerte : sous le texte (`below`, le kit) ou à sa droite (`end`). */
function AlertActions({
  className,
  placement = "below",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertActionsVariants>) {
  return (
    <div
      data-slot="alert-actions"
      data-placement={placement}
      className={cn(alertActionsVariants({ placement }), className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertActions };
