import * as React from "react";

import { cn } from "@etape/ui/lib/utils";

/*
 * La ligne du choix est un `<label>` : toute sa surface coche le contrôle. Les
 * précisions qu'ouvre un choix (`ChoiceCardContent`) vivent DANS la carte mais
 * HORS du libellé, pour qu'un clic sur l'une d'elles ne recoche pas la carte.
 *
 * L'état sélectionné est passé explicitement (`selected`) plutôt que lu dans
 * le contrôle par `:has()` : les précisions contiennent elles-mêmes des
 * contrôles cochés, qui allumeraient la carte à tort.
 */

function ChoiceCard({
  className,
  selected = false,
  ...props
}: React.ComponentProps<"div"> & { selected?: boolean }) {
  return (
    <div
      data-slot="choice-card"
      data-selected={selected || undefined}
      className={cn(
        // Focus clavier repris par la carte entière : le contrôle seul, de
        // 16 px, se repère mal dans une surface de 672.
        "group/choice-card bg-card border-border hover:bg-secondary/40 data-selected:bg-secondary data-selected:border-primary has-[[data-slot=choice-card-label]>:focus-visible]:outline-ring flex w-full flex-col rounded-lg border transition-colors has-[[data-slot=choice-card-label]>:focus-visible]:outline-2 has-[[data-slot=choice-card-label]>:focus-visible]:outline-offset-2",
        className,
      )}
      {...props}
    />
  );
}

/** Le contrôle doit être le premier enfant (`*:first:`). */
function ChoiceCardLabel({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="choice-card-label"
      className={cn(
        // `*:first` : la case, centrée sur la 1re ligne ; son anneau s'efface devant celui de la carte.
        "flex w-full cursor-pointer items-start gap-2 p-4 *:first:mt-1 *:first:focus-visible:ring-0",
        className,
      )}
      {...props}
    />
  );
}

function ChoiceCardText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="choice-card-text"
      className={cn("flex min-w-0 flex-1 flex-col gap-0.5", className)}
      {...props}
    />
  );
}

function ChoiceCardTitle({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="choice-card-title"
      className={cn("text-body text-foreground font-medium", className)}
      {...props}
    />
  );
}

/**
 * Écart au kit : `muted-foreground` ne fait que 4,3:1 sur le fond d'une carte
 * sélectionnée. La description y passe en `content-secondary`.
 */
function ChoiceCardDescription({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="choice-card-description"
      className={cn(
        "text-body-sm text-muted-foreground group-data-selected/choice-card:text-content-secondary",
        className,
      )}
      {...props}
    />
  );
}

/** `-mt-1` : 12 px sous la ligne du choix (maquette), malgré son `p-4`. */
function ChoiceCardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="choice-card-content"
      className={cn("-mt-1 flex flex-col gap-3 px-4 pb-4", className)}
      {...props}
    />
  );
}

export {
  ChoiceCard,
  ChoiceCardContent,
  ChoiceCardDescription,
  ChoiceCardLabel,
  ChoiceCardText,
  ChoiceCardTitle,
};
