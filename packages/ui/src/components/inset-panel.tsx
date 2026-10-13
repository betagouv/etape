import * as React from "react";

import { cn } from "@etape/ui/lib/utils";

/*
 * Encart en retrait qui regroupe ce qu'un choix vient d'ouvrir : décalé sous
 * ce choix, sur fond `secondary`, marqué d'un filet à gauche (maquette
 * SIMULATEUR-v3, Q7 : la région de travail sous « Je travaille dans une autre
 * région »).
 *
 * Même apparence que l'`Alert` `emphasis`, mais ce n'est pas un message : il
 * contient des champs, et ne prend donc ni sa grille ni sa typographie.
 */
function InsetPanel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="inset-panel" className="ps-5">
      <div
        className={cn(
          "bg-secondary border-l-primary flex flex-col gap-4 rounded-r-md border-l-3 px-5 py-4",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export { InsetPanel };
