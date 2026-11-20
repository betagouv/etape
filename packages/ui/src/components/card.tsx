import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@etape/ui/lib/utils";

const cardVariants = cva("flex flex-col py-6", {
  variants: {
    variant: {
      default: "bg-card text-card-foreground gap-6 rounded-xl border shadow-sm",
      muted: "bg-muted text-card-foreground gap-3 rounded-sm lg:gap-4",
      outline: "bg-card text-card-foreground gap-4 rounded-xl border",
      panel: "bg-card text-card-foreground gap-5 rounded-2xl border px-5",
      /** Récapitulatif dans un formulaire, `front-office-form-card` du kit ; son titre prend la variante de `CardTitle` de son type. */
      secondary: "bg-secondary text-card-foreground gap-3 rounded-xl border px-4 py-3",
      /**
       * Carte de saisie dans un formulaire (maquette FRONT-OFFICE, « Démarche 1 ») : un cadre fin,
       * sans fond. `data-highlighted` la fait ressortir quand elle vient d'apparaître
       * (« Démarche 2 - Highlight ») : bordure `primary` et halo de 2 px.
       */
      form: "text-card-foreground data-[highlighted=true]:border-primary data-[highlighted=true]:bg-card data-[highlighted=true]:shadow-primary gap-4 rounded-md border px-3 py-3 data-[highlighted=true]:shadow-[0_0_2px] [&_[data-slot=card-description]]:leading-5",
      // Les enfants passent sur fond `primary` : le `muted-foreground` de
      // `CardDescription` y tomberait à 2:1, le filet `border` y trancherait.
      primary:
        "bg-primary text-primary-foreground gap-4 rounded-xl border border-primary [&_[data-slot=card-description]]:text-primary-foreground [&_[data-slot=separator]]:bg-primary-subtle [&_[data-slot=badge]]:bg-primary-subtle [&_[data-slot=badge]]:text-primary-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Card({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof cardVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="card"
      data-variant={variant}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
      )}
      {...props}
    />
  );
}

const cardTitleVariants = cva("", {
  variants: {
    variant: {
      default: "leading-none font-semibold",
      /** Titre d'un récapitulatif de formulaire (`front-office-form-card` du kit, `Type=compagny & job`) : 16/24, en `primary`. */
      summary: "text-primary text-base leading-6 font-semibold",
      /** Titre d'une carte de saisie et d'une démarche validée (`Type=démarche`) : 14/20, graisse 500, en `primary`. */
      label: "text-primary text-sm leading-5 font-medium",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function CardTitle({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardTitleVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="card-title"
      className={cn(cardTitleVariants({ variant }), className)}
      {...props}
    />
  );
}

/** Dans un titre `label` : ce qui nomme l'élément, après son libellé (« Démarche 1 : **Salon** »). */
function CardTitleValue({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="card-title-value"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-6", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

/** Liste « libellé / valeur » : un `CardDetail` par ligne, avec son `CardDetailLabel` et son `CardDetailValue`. */
function CardDetails({ className, ...props }: React.ComponentProps<"dl">) {
  return (
    <dl
      data-slot="card-details"
      className={cn("flex flex-col gap-3 text-sm", className)}
      {...props}
    />
  );
}

const cardDetailVariants = cva("flex", {
  variants: {
    orientation: {
      horizontal: "items-center justify-between gap-4",
      /** Le libellé au-dessus de sa valeur, pour un texte long ou une liste (`front-office-form-card`, `Type=démarche`). */
      vertical:
        "flex-col gap-2 [&>[data-slot=card-detail-label]]:font-medium [&>[data-slot=card-detail-value]]:text-left",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

/** Une ligne de `CardDetails` : le libellé à gauche et la valeur à droite, ou l'un au-dessus de l'autre. */
function CardDetail({
  className,
  orientation,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardDetailVariants>) {
  return (
    <div
      data-slot="card-detail"
      data-orientation={orientation ?? "horizontal"}
      className={cn(cardDetailVariants({ orientation }), className)}
      {...props}
    />
  );
}

/** Le libellé d'une ligne, qu'une icône peut précéder. */
function CardDetailLabel({ className, ...props }: React.ComponentProps<"dt">) {
  return (
    <dt
      data-slot="card-detail-label"
      className={cn("text-primary flex items-center gap-2 [&>svg]:size-4", className)}
      {...props}
    />
  );
}

/** La valeur d'une ligne, alignée à droite. */
function CardDetailValue({ className, ...props }: React.ComponentProps<"dd">) {
  return <dd data-slot="card-detail-value" className={cn("text-right", className)} {...props} />;
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardTitleValue,
  CardAction,
  CardDescription,
  CardContent,
  CardDetails,
  CardDetail,
  CardDetailLabel,
  CardDetailValue,
  cardVariants,
};
