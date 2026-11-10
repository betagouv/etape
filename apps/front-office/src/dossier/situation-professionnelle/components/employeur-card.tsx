import type { Etablissement } from "@etape/api-contract";
import {
  BriefcaseBusinessIcon,
  FileDigitIcon,
  MapPinnedIcon,
  PencilLineIcon,
  SignpostIcon,
  type LucideIcon,
} from "lucide-react";

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

import { formatSiret } from "../domain/format-siret";

interface Row {
  Icon: LucideIcon;
  label: string;
  value: string | null;
}

export interface EmployeurCardProps {
  etablissement: Etablissement;
  /** Vrai quand la carte vient d'être choisie : le focus passe au bouton, le champ ayant disparu. */
  isFocusRequested: boolean;
  onChange: () => void;
}

/** L'établissement choisi, tel que Sirene le décrit. */
export function EmployeurCard({ etablissement, isFocusRequested, onChange }: EmployeurCardProps) {
  const rows: Row[] = [
    { Icon: SignpostIcon, label: "Enseigne", value: etablissement.enseigne },
    { Icon: MapPinnedIcon, label: "Adresse", value: etablissement.adresse },
    { Icon: FileDigitIcon, label: "SIRET", value: formatSiret(etablissement.siret) },
    {
      Icon: BriefcaseBusinessIcon,
      label: "Secteur d’activité",
      value: etablissement.secteurActivite,
    },
  ];

  return (
    <Card variant="secondary">
      <div className="flex items-center justify-between gap-4">
        <CardTitle asChild>
          <h4>{etablissement.denomination}</h4>
        </CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onChange}
          autoFocus={isFocusRequested}
        >
          <PencilLineIcon aria-hidden="true" />
          Changer l’entreprise
        </Button>
      </div>
      <Separator />
      <CardDetails>
        {rows
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
      <CardDescription>Informations issues du répertoire Sirene de l’Insee</CardDescription>
    </Card>
  );
}
