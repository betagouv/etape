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

const calloutBodyVariants = cva("", {
  variants: {
    variant: {
      default: "contents",
      secondary: "flex min-w-0 flex-1 items-center gap-3.5",
    },
  },
});

const calloutIconVariants = cva("flex shrink-0 items-center justify-center", {
  variants: {
    variant: {
      default: "bg-secondary rounded-sm p-2",
      secondary: "bg-background size-11 rounded-md",
    },
  },
});

const calloutHeadingVariants = cva("flex min-w-0 flex-col break-words", {
  variants: {
    variant: {
      default: "gap-1",
      secondary: "gap-0",
    },
  },
});

const calloutTitleVariants = cva("text-foreground", {
  variants: {
    variant: {
      default: "text-body font-bold",
      secondary: "text-body font-semibold",
    },
  },
});

const calloutTextVariants = cva("", {
  variants: {
    variant: {
      default: "text-body text-content-secondary",
      // Écart à la maquette : `muted-foreground` ne fait que 4,3:1 sur `secondary`.
      secondary: "text-body-sm text-content-secondary",
    },
  },
});

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
  return (
    <div
      data-slot="callout"
      data-variant={variant}
      className={cn(calloutVariants({ variant }), className)}
      {...props}
    >
      <div data-slot="callout-body" className={calloutBodyVariants({ variant })}>
        <div className={calloutIconVariants({ variant })}>
          <Icon aria-hidden="true" focusable="false" className="text-primary size-6" />
        </div>

        <div className={calloutHeadingVariants({ variant })}>
          <TitleTag className={calloutTitleVariants({ variant })}>{title}</TitleTag>
          <div className={calloutTextVariants({ variant })}>{children}</div>
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
