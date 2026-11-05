import { useId } from "react";

import { sectionCaptionVariants } from "@etape/ui/components/section";
import { Separator } from "@etape/ui/components/separator";

import type { Volet } from "../domain/volets";
import { FormSidebarItem } from "./form-sidebar-item";

export interface FormSidebarProps {
  volets: Volet[];
}

/** Volets du dossier et leur avancement. */
export function FormSidebar({ volets }: FormSidebarProps) {
  const labelId = useId();

  return (
    <nav aria-labelledby={labelId} className="flex flex-col gap-3 lg:w-67.5">
      <p id={labelId} className={sectionCaptionVariants({ variant: "compact" })}>
        Mon dossier
      </p>
      <ol className="flex flex-col gap-1 py-1">
        {volets.map((volet) => (
          <FormSidebarItem key={volet.id} volet={volet} />
        ))}
      </ol>
      <Separator />
    </nav>
  );
}
