import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@etape/ui/lib/utils";

/** Apparences d'`InsetPanel`. */
const INSET_PANEL_VARIANT = {
  DEFAULT: "default",
  PLAIN: "plain",
  COMPACT: "compact",
} as const;

/** Apparence d'un `InsetPanel`. */
type InsetPanelVariant = (typeof INSET_PANEL_VARIANT)[keyof typeof INSET_PANEL_VARIANT];

const insetPanelVariants = cva("bg-secondary flex flex-col", {
  variants: {
    variant: {
      /* Même apparence que l'`Alert` `emphasis`, mais contient des champs : ni sa grille ni sa typographie. */
      [INSET_PANEL_VARIANT.DEFAULT]: "border-l-primary gap-4 rounded-r-md border-l-3 px-5 py-4",
      /* Sans filet ni retrait : « Vous ne trouvez pas l'e-mail ? » (Figma FRONT-OFFICE, écrans 08 et 09). */
      [INSET_PANEL_VARIANT.PLAIN]: "gap-3 rounded-md px-4 py-3",
      /* Sans filet ni retrait, resserré : critères du mot de passe (Figma FRONT-OFFICE, écran 10). */
      [INSET_PANEL_VARIANT.COMPACT]: "gap-2 rounded-md px-3 py-2",
    },
  },
});

const IS_INDENTED: Record<InsetPanelVariant, boolean> = {
  [INSET_PANEL_VARIANT.DEFAULT]: true,
  [INSET_PANEL_VARIANT.PLAIN]: false,
  [INSET_PANEL_VARIANT.COMPACT]: false,
};

/** Props d'`InsetPanel` : celles d'un `<div>`, plus l'apparence. */
interface InsetPanelProps extends React.ComponentProps<"div"> {
  variant?: InsetPanelVariant;
}

/** Encart sur fond `secondary` qui regroupe des champs ou des indications sous un même bloc. */
function InsetPanel({
  className,
  variant = INSET_PANEL_VARIANT.DEFAULT,
  ...props
}: InsetPanelProps) {
  const panelClassName = cn(insetPanelVariants({ variant }), className);

  if (!IS_INDENTED[variant]) {
    return <div data-slot="inset-panel" className={panelClassName} {...props} />;
  }

  return (
    <div data-slot="inset-panel" className="ps-5">
      <div className={panelClassName} {...props} />
    </div>
  );
}

export { InsetPanel, INSET_PANEL_VARIANT, type InsetPanelProps, type InsetPanelVariant };
