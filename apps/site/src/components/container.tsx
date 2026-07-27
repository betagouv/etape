import * as React from "react";

import { cn } from "@etape/ui/lib/utils";

/**
 * Gouttières et largeur maximale communes à toutes les zones de contenu.
 *
 * Reprend la maquette Figma : un contenu de 1088 px centré dans une fenêtre de
 * 1280 px, soit 96 px de marge latérale (`Padding/5XL`). En dessous, les
 * gouttières se resserrent pour laisser respirer le contenu sur petit écran.
 */
export function Container({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 xl:px-24", className)} {...props} />
  );
}
