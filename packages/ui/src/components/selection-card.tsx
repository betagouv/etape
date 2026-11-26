import { PencilLineIcon, type LucideIcon } from "lucide-react";

import { Button } from "@etape/ui/components/button";
import {
  Card,
  CardDescription,
  CardDetail,
  CardDetailLabel,
  CardDetails,
  CardDetailValue,
  CardTitle,
} from "@etape/ui/components/card";
import { Separator } from "@etape/ui/components/separator";

/** Une ligne de la carte ; sans valeur, elle n'est pas affichée. */
interface SelectionCardDetail {
  Icon: LucideIcon;
  label: string;
  value: string | null;
}

/** Le bouton qui remet le choix en jeu. */
interface SelectionCardChangeButton {
  label: string;
  /** Vrai quand la carte vient de remplacer le champ : le focus passe au bouton. */
  isFocusRequested: boolean;
  onClick: () => void;
}

/** Ce que reçoit `SelectionCard` : le choix à afficher, sa source et de quoi en changer. */
interface SelectionCardProps {
  title: string;
  details: SelectionCardDetail[];
  /** D'où viennent les informations affichées. */
  source: string;
  changeButton: SelectionCardChangeButton;
  /** Mise en page seulement : largeur, marge. */
  className?: string;
}

/**
 * Le choix fait dans un champ de recherche (`RemoteSearchField`), à la place du champ :
 * `front-office-form-card` de la maquette FRONT-OFFICE. Le titre est un `h4`, sous le
 * titre de section du formulaire.
 */
function SelectionCard({ title, details, source, changeButton, className }: SelectionCardProps) {
  return (
    <Card data-slot="selection-card" variant="secondary" className={className}>
      <div className="flex items-center justify-between gap-4">
        <CardTitle variant="summary" asChild>
          <h4>{title}</h4>
        </CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={changeButton.onClick}
          autoFocus={changeButton.isFocusRequested}
        >
          <PencilLineIcon aria-hidden="true" />
          {changeButton.label}
        </Button>
      </div>
      <Separator />
      <CardDetails>
        {details
          // Une information que la source ne donne pas n'a pas de ligne, plutôt qu'un libellé sans valeur.
          .filter(({ value }) => value !== null)
          .map(({ Icon, label, value }) => (
            <CardDetail key={label}>
              <CardDetailLabel>
                <Icon aria-hidden="true" />
                {label}
              </CardDetailLabel>
              <CardDetailValue>{value}</CardDetailValue>
            </CardDetail>
          ))}
      </CardDetails>
      <Separator />
      <CardDescription>{source}</CardDescription>
    </Card>
  );
}

export { SelectionCard };
export type { SelectionCardChangeButton, SelectionCardDetail, SelectionCardProps };
