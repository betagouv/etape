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
import { Card } from "@etape/ui/components/card";
import { Separator } from "@etape/ui/components/separator";

import { formatSiret } from "../domain/format-siret";

interface Ligne {
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
  const lignes: Ligne[] = [
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
        <h4 className="text-primary text-base font-semibold">{etablissement.denomination}</h4>
        <Button variant="outline" size="sm" onClick={onChange} autoFocus={isFocusRequested}>
          <PencilLineIcon aria-hidden="true" />
          Changer l’entreprise
        </Button>
      </div>
      <Separator />
      <dl className="flex flex-col gap-3 text-sm">
        {lignes
          .filter(({ value }) => value !== null)
          .map(({ Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <dt className="text-primary flex items-center gap-2">
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </dt>
              <dd className="text-right">{value}</dd>
            </div>
          ))}
      </dl>
      <Separator />
      <p className="text-muted-foreground text-sm">
        Informations issues du répertoire Sirene de l’Insee
      </p>
    </Card>
  );
}
