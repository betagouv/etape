import * as React from "react";

import { cn } from "@etape/ui/lib/utils";

/* Même apparence que l'`Alert` `emphasis`, mais contient des champs : ni sa grille ni sa typographie. */
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
