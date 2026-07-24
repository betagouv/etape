import type { Critere, CritereStatut } from "../domain/types";
import { CircleAlertIcon, CircleCheckIcon, CircleXIcon } from "./icons";

// Statut → icône + classe de couleur (texte ET icône via currentColor).
const STATUT_UI: Record<
  CritereStatut,
  { Icon: (props: { className?: string }) => React.ReactNode; color: string }
> = {
  valide: { Icon: CircleCheckIcon, color: "text-success-text" },
  "a-verifier": { Icon: CircleAlertIcon, color: "text-warning-text" },
  manquant: { Icon: CircleXIcon, color: "text-destructive-text" },
};

/** Liste « Critères d'accès » d'un dispositif : icône de statut + libellé. */
export function CriteriaList({ criteres }: { criteres: Critere[] }) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-3">
      <p className="text-muted-foreground text-base leading-6 font-bold">Critères d’accès</p>
      <ul className="flex flex-col gap-3">
        {criteres.map((critere, index) => {
          const { Icon, color } = STATUT_UI[critere.statut];
          return (
            <li key={`${critere.label}-${index}`} className={`flex items-start gap-2 ${color}`}>
              <span className="flex shrink-0 py-0.5">
                <Icon className="size-4" />
              </span>
              <span className="text-sm leading-5">{critere.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
