import * as React from "react";

import { cn } from "@etape/ui/lib/utils";

/*
 * Carte de réponse du kit Figma (« RadioButton », `radio-card`) : un choix
 * présenté en carte, avec son libellé et sa description. Elle accueille un
 * bouton radio comme une case à cocher — c'est le contrôle placé dedans qui
 * porte la sémantique ; la carte n'en est que la surface.
 *
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

/** Ligne cliquable du choix : le contrôle, puis `ChoiceCardText`. */
function ChoiceCardLabel({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="choice-card-label"
      className={cn(
        // `mt-1` sur le contrôle : sa boîte de 16 px centrée sur la première
        // ligne de 24 px du libellé, quelle que soit la longueur du texte. Son
        // propre anneau de focus s'efface devant celui de la carte.
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

/**
 * Précisions ouvertes par le choix, sous sa ligne. `-mt-1` : 12 px entre la
 * ligne et le premier séparateur, comme dans la maquette, malgré les 16 px de
 * marge du libellé.
 */
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
