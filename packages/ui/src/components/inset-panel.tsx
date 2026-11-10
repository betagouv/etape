import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@etape/ui/lib/utils";

const INSET_PANEL_VARIANT = {
  DEFAULT: "default",
  PLAIN: "plain",
} as const;

type InsetPanelVariant = (typeof INSET_PANEL_VARIANT)[keyof typeof INSET_PANEL_VARIANT];

const insetPanelVariants = cva("bg-secondary flex flex-col", {
  variants: {
    variant: {
      /* Même apparence que l'`Alert` `emphasis`, mais contient des champs : ni sa grille ni sa typographie. */
      [INSET_PANEL_VARIANT.DEFAULT]: "border-l-primary gap-4 rounded-r-md border-l-3 px-5 py-4",
      /* Sans filet ni retrait : critères du mot de passe et « Vous ne trouvez pas l'e-mail ? » (Figma FRONT-OFFICE, écrans 08 à 10). */
      [INSET_PANEL_VARIANT.PLAIN]: "gap-3 rounded-md px-4 py-3",
    },
  },
  defaultVariants: {
    variant: INSET_PANEL_VARIANT.DEFAULT,
  },
});

const IS_INDENTED: Record<InsetPanelVariant, boolean> = {
  [INSET_PANEL_VARIANT.DEFAULT]: true,
  [INSET_PANEL_VARIANT.PLAIN]: false,
};

function InsetPanel({
  className,
  variant = INSET_PANEL_VARIANT.DEFAULT,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof insetPanelVariants>) {
  const panelClassName = cn(insetPanelVariants({ variant }), className);

  if (!IS_INDENTED[variant ?? INSET_PANEL_VARIANT.DEFAULT]) {
    return <div data-slot="inset-panel" className={panelClassName} {...props} />;
  }

  return (
    <div data-slot="inset-panel" className="ps-5">
      <div className={panelClassName} {...props} />
    </div>
  );
}

export { InsetPanel, INSET_PANEL_VARIANT };
