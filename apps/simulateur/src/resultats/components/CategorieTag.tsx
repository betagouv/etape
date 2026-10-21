import type { ComponentProps } from "react";
import { BoxIcon, FileTextIcon, MessagesSquareIcon, type LucideIcon } from "lucide-react";

import { Badge } from "@etape/ui/components/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@etape/ui/components/tooltip";

import { CATEGORIE_DEFINITIONS, CATEGORIE_LABELS, type Categorie } from "../domain/types";

// Seul repère de catégorie de la liste : libellé, icône et couleur, jamais la couleur seule.
const TAG_UI: Record<
  Categorie,
  { Icon: LucideIcon; variant: NonNullable<ComponentProps<typeof Badge>["variant"]> }
> = {
  interlocuteur: { Icon: MessagesSquareIcon, variant: "info" },
  outil: { Icon: BoxIcon, variant: "violet" },
  dispositif: { Icon: FileTextIcon, variant: "warning" },
};

interface CategorieTagProps {
  categorie: Categorie;
}

export function CategorieTag({ categorie }: CategorieTagProps) {
  const { Icon, variant } = TAG_UI[categorie];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge asChild variant={variant} size="lg">
          <button type="button">
            <Icon aria-hidden="true" />
            <span className="sr-only">Catégorie : </span>
            {CATEGORIE_LABELS[categorie]}
          </button>
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{CATEGORIE_DEFINITIONS[categorie]}</TooltipContent>
    </Tooltip>
  );
}
