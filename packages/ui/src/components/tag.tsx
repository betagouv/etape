import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@etape/ui/lib/utils";

/*
 * Composant « Tag » du kit Figma (page Tag) : statut × importance × taille.
 * Chaque statut fournit ses quatre couleurs en variables, que l'importance
 * consomme ; d'où 6 + 4 variantes au lieu de 24 combinaisons.
 */
const tagVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center overflow-hidden rounded-full border border-transparent font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-4",
  {
    variants: {
      status: {
        neutral:
          "[--tag-fg:var(--color-content-strong)] [--tag-muted:var(--color-muted)] [--tag-solid:var(--color-content-strong)] [--tag-solid-fg:var(--color-background)]",
        primary:
          "[--tag-fg:var(--color-primary)] [--tag-muted:var(--color-secondary)] [--tag-solid:var(--color-primary)] [--tag-solid-fg:var(--color-primary-foreground)]",
        success:
          "[--tag-fg:var(--color-success-text)] [--tag-muted:var(--color-success-muted)] [--tag-solid:var(--color-success)] [--tag-solid-fg:var(--color-success-foreground)]",
        info: "[--tag-fg:var(--color-info-text)] [--tag-muted:var(--color-info-muted)] [--tag-solid:var(--color-info)] [--tag-solid-fg:var(--color-info-foreground)]",
        warning:
          "[--tag-fg:var(--color-warning-text)] [--tag-muted:var(--color-warning-muted)] [--tag-solid:var(--color-warning)] [--tag-solid-fg:var(--color-warning-foreground)]",
        error:
          "[--tag-fg:var(--color-destructive-text)] [--tag-muted:var(--color-destructive-muted)] [--tag-solid:var(--color-destructive-text)] [--tag-solid-fg:var(--color-destructive-foreground)]",
      },
      importance: {
        subdued: "text-(--tag-fg)",
        default: "bg-(--tag-muted) text-(--tag-fg)",
        emphasized: "bg-(--tag-solid) text-(--tag-solid-fg)",
        bordered: "border-(--tag-fg) bg-(--tag-muted) text-(--tag-fg)",
      },
      size: {
        xs: "h-5 gap-1 px-2 text-xs font-normal [&>svg]:size-3",
        sm: "h-6 gap-1 px-2 text-xs",
        default: "h-8 gap-2 px-3 text-sm",
        lg: "h-10 gap-2 px-3 text-base",
      },
    },
    defaultVariants: {
      status: "neutral",
      importance: "default",
      size: "default",
    },
  },
);

function Tag({
  className,
  status = "neutral",
  importance = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof tagVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="tag"
      data-status={status}
      data-importance={importance}
      data-size={size}
      className={cn(tagVariants({ status, importance, size }), className)}
      {...props}
    />
  );
}

export { Tag, tagVariants };
