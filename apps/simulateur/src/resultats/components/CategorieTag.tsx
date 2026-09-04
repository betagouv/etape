import { FileTextIcon, UsersRoundIcon, WrenchIcon, type LucideIcon } from "lucide-react";

import { Badge } from "@etape/ui/components/badge";

import { CATEGORIE_LABELS, type Categorie } from "../domain/types";

/**
 * Habillage du tag. La liste des cartes n'étant pas découpée en sections, le
 * tag est le SEUL repère de catégorie : il porte donc à la fois un libellé, une
 * icône et une couleur — jamais la couleur seule.
 */
const TAG_UI: Record<Categorie, { Icon: LucideIcon; className: string }> = {
  interlocuteur: {
    Icon: UsersRoundIcon,
    className: "bg-secondary text-secondary-foreground",
  },
  outil: {
    Icon: WrenchIcon,
    className: "bg-info-muted text-info-text",
  },
  dispositif: {
    Icon: FileTextIcon,
    className: "bg-success-muted text-success-text",
  },
};

export function CategorieTag({ categorie }: { categorie: Categorie }) {
  const { Icon, className } = TAG_UI[categorie];

  return (
    <Badge variant="secondary" className={`gap-1.5 px-2.5 py-1 text-xs ${className}`}>
      <Icon aria-hidden="true" />
      <span className="sr-only">Catégorie : </span>
      {CATEGORIE_LABELS[categorie]}
    </Badge>
  );
}
