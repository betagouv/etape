"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { Accordion as AccordionPrimitive } from "radix-ui";

import { cn } from "@etape/ui/lib/utils";
import { focusRing } from "@etape/ui/lib/focus";

/**
 * Accordéon en cartes, tel que défini dans la maquette (`Accordion / AccordionItem`).
 *
 * Chaque item est une carte autonome, séparée de la suivante par un `Gap/L` :
 * contrairement à l'accordéon shadcn d'origine, les items ne partagent pas un
 * filet commun. Le filet n'apparaît qu'à l'ouverture, entre la question et sa
 * réponse.
 *
 * `Root` reste non contraint : c'est l'appelant qui choisit `type="single"` ou
 * `"multiple"` selon la règle métier.
 */
function Accordion({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    />
  );
}

/*
 * La gouttière horizontale (`Padding/L`) est portée par l'item, la verticale par
 * le déclencheur et le contenu. C'est ce partage qui donne, sans surcouche, les
 * deux propriétés de la maquette : un filet d'ouverture en retrait de 16px des
 * bords de la carte, et un déclencheur qui occupe toute la largeur et toute la
 * hauteur de la zone « question » — soit une cible de 52px, bien au-delà des
 * 24px exigés par le critère « taille de cible » (WCAG 2.5.8).
 */
function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("bg-card border-border rounded-sm border px-4", className)}
      {...props}
    />
  );
}

/**
 * Déclencheur d'un item.
 *
 * `AccordionPrimitive.Header` rend un `<h3>` : le niveau attendu sous le `<h2>`
 * d'une `Section`. Passer `asChild` sur l'en-tête si le plan du document impose
 * un autre niveau.
 */
function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          // Pas d'`outline-none` ici : en Tailwind v4 il fixe `--tw-outline-style`
          // à `none`, ce qui neutralise silencieusement l'anneau de `focusRing`.
          // `cursor-pointer` est explicite : le preflight de Tailwind v4 laisse
          // aux boutons le curseur par défaut du navigateur, soit la flèche.
          "text-body-sm flex flex-1 cursor-pointer items-center justify-between gap-4 rounded-sm py-4 text-left font-semibold hover:underline disabled:pointer-events-none disabled:opacity-50",
          // Le chevron n'expose pas `data-state` : la rotation est pilotée
          // depuis le déclencheur, qui le porte.
          "[&[data-state=open]>svg]:rotate-180",
          focusRing,
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon
          aria-hidden="true"
          focusable="false"
          className="text-muted-foreground pointer-events-none size-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      // `motion-reduce` : l'ouverture devient instantanée quand le système
      // demande de limiter les animations (WCAG 2.3.3, RGAA 13.8).
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden motion-reduce:animate-none"
      {...props}
    >
      {/*
        Le filet de séparation est porté par le contenu, jamais par le
        déclencheur : celui-ci est arrondi pour son anneau de focus, et une
        bordure basse en épouserait les coins — le trait remonterait à ses
        extrémités. Ici il reste droit, et n'existe que quand un contenu est
        déplié, ce qui est exactement sa condition d'affichage dans la maquette.
      */}
      <div className={cn("text-body-sm border-border border-t py-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
