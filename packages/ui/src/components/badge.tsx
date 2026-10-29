import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@etape/ui/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
        // Variantes ETAPE (hors shadcn) : fond adouci et libellé teinté, pour
        // qualifier une information sans l'aspect d'une action. Tokens Figma
        // Info/Background + Info/Text et Success/Background + Success/Text.
        info: "bg-info-muted text-info-text [a&]:hover:bg-info-muted/80",
        success: "bg-success-muted text-success-text [a&]:hover:bg-success-muted/80",
        warning: "bg-warning-muted text-warning-text [a&]:hover:bg-warning-muted/80",
        violet: "bg-violet-muted text-violet-text [a&]:hover:bg-violet-muted/80",
        // Tags des en-têtes du front-office, sur `surface-warm`. Tokens Figma
        // base/background + neutral/800, et colors/warning + colors/warning-contrast.
        // `-solid` marque le fond plein : à l'inverse de `Button`, où le nom nu
        // est plein et `-subdued` adouci, le nom nu est ici adouci.
        inverse: "bg-background text-content-strong [a&]:hover:bg-background/90",
        "warning-solid": "bg-warning text-warning-foreground [a&]:hover:bg-warning/90",
      },
      size: {
        default: "py-0.5 [&>svg]:size-3",
        lg: "py-1 [&>svg]:size-4",
        xl: "min-h-8 gap-2 px-3 py-1 text-sm [&>svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      data-size={size}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
