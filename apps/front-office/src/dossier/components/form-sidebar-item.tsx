import { focusRing } from "@etape/ui/lib/focus";
import { cn } from "@etape/ui/lib/utils";

import type { VoletProgress } from "../domain/statut-volet";
import { getStatutVolet, listStatutVoletLines } from "../domain/statut-volet";
import type { VoletDefinition } from "../domain/volets";
import { StatutVoletIcon, StatutVoletLabel } from "./statut-volet";
import { VoletLink } from "./volet-link";

/** Ce que reçoit `FormSidebarItem` : le volet, avec son avancement quand il est connu. */
export interface FormSidebarItemProps {
  volet: VoletDefinition & Partial<VoletProgress>;
}

function hasProgress(volet: Partial<VoletProgress>): volet is VoletProgress {
  return typeof volet.requiredFieldCount === "number";
}

/** Un volet dans la barre latérale : son lien, l'icône et les lignes de son statut. */
export function FormSidebarItem({ volet }: FormSidebarItemProps) {
  return (
    <li>
      <VoletLink
        voletId={volet.id}
        activeProps={{ className: "bg-surface-warm-muted" }}
        className={cn("flex items-center gap-3 rounded-lg px-3 py-2", focusRing)}
      >
        {hasProgress(volet) && <StatutVoletIcon statut={getStatutVolet(volet)} />}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-foreground text-base">{volet.label}</span>
          {hasProgress(volet) &&
            listStatutVoletLines(volet).map((line) => (
              <StatutVoletLabel key={line.statut} line={line} />
            ))}
        </span>
      </VoletLink>
    </li>
  );
}
