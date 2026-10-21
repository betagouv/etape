import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";

import { cn } from "@etape/ui/lib/utils";

type CalloutTitleTag = "p" | "h1" | "h2" | "h3";

const calloutVariants = cva("flex gap-4", {
  variants: {
    variant: {
      default: "bg-muted items-start rounded-lg p-6",
      secondary: "bg-secondary flex-col rounded-xl px-5 py-3 md:flex-row md:items-center",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type CalloutVariant = NonNullable<VariantProps<typeof calloutVariants>["variant"]>;

// Classes des parties internes, commandées par la même variante que la racine.
const CALLOUT_PARTS: Record<
  CalloutVariant,
  { body: string; icon: string; heading: string; title: string; text: string }
> = {
  default: {
    body: "contents",
    icon: "bg-secondary rounded-sm p-2",
    heading: "gap-1",
    title: "font-bold",
    text: "text-body",
  },
  secondary: {
    body: "flex min-w-0 flex-1 items-center gap-3.5",
    icon: "bg-background size-11 rounded-md",
    heading: "gap-0",
    title: "font-semibold",
    // Écart à la maquette : `muted-foreground` ne fait que 4,3:1 sur `secondary`.
    text: "text-body-sm",
  },
};

function Callout({
  icon: Icon,
  title,
  titleAs: TitleTag = "p",
  variant = "default",
  action,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> &
  VariantProps<typeof calloutVariants> & {
    icon: LucideIcon;
    title: React.ReactNode;
    /**
     * Balise du titre, sans effet sur son apparence. Un encart qui est le seul
     * contenu de la page (échec de connexion, service indisponible) en porte le
     * `h1` : sans lui, la page n'aurait aucun titre.
     */
    titleAs?: CalloutTitleTag;
    action?: React.ReactNode;
  }) {
  const parts = CALLOUT_PARTS[variant ?? "default"];

  return (
    <div
      data-slot="callout"
      data-variant={variant}
      className={cn(calloutVariants({ variant }), className)}
      {...props}
    >
      <div data-slot="callout-body" className={parts.body}>
        <div className={cn("flex shrink-0 items-center justify-center", parts.icon)}>
          <Icon aria-hidden="true" focusable="false" className="text-primary size-6" />
        </div>

        <div className={cn("flex min-w-0 flex-col break-words", parts.heading)}>
          <TitleTag className={cn("text-foreground text-body", parts.title)}>{title}</TitleTag>
          <div className={cn("text-content-secondary", parts.text)}>{children}</div>
        </div>
      </div>

      {action && (
        <div data-slot="callout-action" className="shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}

export { Callout };
