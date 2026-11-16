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

/** Ce que reçoit `SelectionCard` : le choix à afficher, sa source et de quoi en changer. */
interface SelectionCardProps {
  title: string;
  /** Le libellé du bouton qui remet le choix en jeu. */
  changeLabel: string;
  details: SelectionCardDetail[];
  /** D'où viennent les informations affichées. */
  source: string;
  /** Vrai quand la carte vient de remplacer le champ : le focus passe au bouton. */
  isFocusRequested: boolean;
  onChange: () => void;
}

/**
 * Le choix fait dans un champ de recherche (`RemoteSearchField`), à la place du champ :
 * `front-office-form-card` de la maquette FRONT-OFFICE. Le titre est un `h4`, sous le
 * titre de section du formulaire.
 */
function SelectionCard({
  title,
  changeLabel,
  details,
  source,
  isFocusRequested,
  onChange,
}: SelectionCardProps) {
  return (
    <Card variant="secondary">
      <div className="flex items-center justify-between gap-4">
        <CardTitle asChild>
          <h4>{title}</h4>
        </CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onChange}
          autoFocus={isFocusRequested}
        >
          <PencilLineIcon aria-hidden="true" />
          {changeLabel}
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
export type { SelectionCardDetail, SelectionCardProps };
