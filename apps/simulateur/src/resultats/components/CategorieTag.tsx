import type { ComponentProps } from "react";
import { FileTextIcon, UsersRoundIcon, WrenchIcon, type LucideIcon } from "lucide-react";

import { Badge } from "@etape/ui/components/badge";

import { CATEGORIE_LABELS, type Categorie } from "../domain/types";

/**
 * Habillage du tag. La liste des cartes n'étant pas découpée en sections, le
 * tag est le SEUL repère de catégorie : il porte donc à la fois un libellé, une
 * icône et une couleur — jamais la couleur seule.
 *
 * La couleur est choisie parmi les variantes de `Badge`, pas écrite ici : l'app
 * décide de la catégorie, le design system de son apparence.
 */
const TAG_UI: Record<
  Categorie,
  { Icon: LucideIcon; variant: NonNullable<ComponentProps<typeof Badge>["variant"]> }
> = {
  interlocuteur: { Icon: UsersRoundIcon, variant: "secondary" },
  outil: { Icon: WrenchIcon, variant: "info" },
  dispositif: { Icon: FileTextIcon, variant: "success" },
};

interface CategorieTagProps {
  categorie: Categorie;
}

/** Tag de catégorie d'un résultat : icône, libellé et couleur de la variante. */
export function CategorieTag({ categorie }: CategorieTagProps) {
  const { Icon, variant } = TAG_UI[categorie];

  return (
    <Badge variant={variant}>
      <Icon aria-hidden="true" />
      <span className="sr-only">Catégorie : </span>
      {CATEGORIE_LABELS[categorie]}
    </Badge>
  );
}
