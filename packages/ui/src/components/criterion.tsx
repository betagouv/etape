import * as React from "react";
import { cva } from "class-variance-authority";
import { Check, X, type LucideIcon } from "lucide-react";

import { cn } from "@etape/ui/lib/utils";

/** États d'un `Criterion`. */
export const CRITERION_STATUS = {
  MET: "met",
  UNMET: "unmet",
} as const;

/** État d'un `Criterion` : critère satisfait ou non. */
export type CriterionStatus = (typeof CRITERION_STATUS)[keyof typeof CRITERION_STATUS];

// Critères du mot de passe (Figma FRONT-OFFICE, écran 10) : pastille cochée ou barrée.
const criterionMarkVariants = cva("flex shrink-0 rounded-full p-1 [&_svg]:size-2.5", {
  variants: {
    status: {
      [CRITERION_STATUS.MET]: "bg-success-border text-success",
      [CRITERION_STATUS.UNMET]: "bg-divider text-muted-foreground",
    },
  },
});

const criterionLabelVariants = cva("", {
  variants: {
    status: {
      [CRITERION_STATUS.MET]: "text-success",
      [CRITERION_STATUS.UNMET]: "text-muted-foreground",
    },
  },
});

const CRITERION_ICON: Record<CriterionStatus, LucideIcon> = {
  [CRITERION_STATUS.MET]: Check,
  [CRITERION_STATUS.UNMET]: X,
};

/** Props de `Criterion` : celles d'un `<li>`, plus l'état et sa lecture. */
export interface CriterionProps extends React.ComponentProps<"li"> {
  status: CriterionStatus;
  /** Lu après le libellé par les lecteurs d'écran, la pastille étant décorative. */
  statusLabel: string;
}

/** Une ligne d'une liste de critères : pastille d'état, libellé, état lu en clair. */
export function Criterion({ status, statusLabel, className, children, ...props }: CriterionProps) {
  const Icon = CRITERION_ICON[status];

  return (
    <li
      data-slot="criterion"
      data-status={status}
      className={cn("flex items-center gap-1.5 text-sm", className)}
      {...props}
    >
      <span data-slot="criterion-mark" aria-hidden className={criterionMarkVariants({ status })}>
        <Icon />
      </span>
      <span data-slot="criterion-label" className={criterionLabelVariants({ status })}>
        {children}
      </span>
      <span data-slot="criterion-status" className="sr-only">
        {statusLabel}
      </span>
    </li>
  );
}
