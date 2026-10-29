import type { ReactNode } from "react";

import { cn } from "@etape/ui/lib/utils";
import { CheckIcon, CircleAlertIcon } from "lucide-react";

import { STATUT_VOLET, type StatutVolet, type StatutVoletLine } from "../domain/statut-volet";

interface StatutVoletUi {
  icon: ReactNode;
  textClassName: string;
}

const A_REMPLIR_UI: StatutVoletUi = {
  icon: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="text-muted-foreground size-5 shrink-0"
    >
      <circle cx="10" cy="10" r="9.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  textClassName: "text-muted-foreground",
};

const STATUT_VOLET_UI: Record<StatutVolet, StatutVoletUi> = {
  [STATUT_VOLET.A_REMPLIR]: A_REMPLIR_UI,
  [STATUT_VOLET.EN_COURS]: {
    icon: (
      <svg
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
        className="text-primary size-5 shrink-0"
      >
        <circle cx="10" cy="10" r="9.25" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 3a7 7 0 0 1 0 14Z" fill="currentColor" />
      </svg>
    ),
    textClassName: "text-primary",
  },
  [STATUT_VOLET.A_CORRIGER]: {
    icon: (
      <CircleAlertIcon
        aria-hidden="true"
        className="text-destructive-text size-5 shrink-0"
        strokeWidth={1.5}
        absoluteStrokeWidth
      />
    ),
    textClassName: "text-destructive-text",
  },
  [STATUT_VOLET.COMPLET]: {
    icon: (
      <span
        aria-hidden="true"
        className="bg-primary text-primary-foreground flex size-5 shrink-0 items-center justify-center rounded-full"
      >
        <CheckIcon size={12} strokeWidth={1.5} absoluteStrokeWidth />
      </span>
    ),
    textClassName: "text-primary",
  },
  // Absent de la maquette : l'apparence d'« À remplir » en attendant l'UI/UX.
  [STATUT_VOLET.FACULTATIF]: A_REMPLIR_UI,
};

export interface StatutVoletIconProps {
  statut: StatutVolet;
}

export function StatutVoletIcon({ statut }: StatutVoletIconProps) {
  return STATUT_VOLET_UI[statut].icon;
}

export interface StatutVoletLabelProps {
  line: StatutVoletLine;
}

export function StatutVoletLabel({ line }: StatutVoletLabelProps) {
  return (
    <span className={cn("text-xs font-medium", STATUT_VOLET_UI[line.statut].textClassName)}>
      {line.label}
    </span>
  );
}
