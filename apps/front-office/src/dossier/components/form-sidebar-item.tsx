import { focusRing } from "@etape/ui/lib/focus";
import { cn } from "@etape/ui/lib/utils";

import { getStatutVolet, listStatutVoletLines } from "../domain/statut-volet";
import type { Volet } from "../domain/types";
import { StatutVoletIcon, StatutVoletLabel } from "./statut-volet";
import { VoletLink } from "./volet-link";

export interface FormSidebarItemProps {
  volet: Volet;
}

export function FormSidebarItem({ volet }: FormSidebarItemProps) {
  return (
    <li>
      {/* Le routeur marque le volet affiché : `aria-current="page"` et `activeProps`. */}
      <VoletLink
        voletId={volet.id}
        activeProps={{ className: "bg-surface-warm-muted" }}
        className={cn("flex items-center gap-3 rounded-lg px-3 py-2", focusRing)}
      >
        <StatutVoletIcon statut={getStatutVolet(volet)} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-foreground text-base">{volet.label}</span>
          {listStatutVoletLines(volet).map((line) => (
            <StatutVoletLabel key={line.statut} line={line} />
          ))}
        </span>
      </VoletLink>
    </li>
  );
}
