import { useId, type ComponentProps } from "react";

import { HOME_PATH } from "@etape/session";
import { Badge } from "@etape/ui/components/badge";
import { Button } from "@etape/ui/components/button";
import { Container } from "@etape/ui/components/container";
import { Progress } from "@etape/ui/components/progress";
import { Tag } from "@etape/ui/components/tag";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, CheckIcon, ClockIcon, FolderOpenIcon, type LucideIcon } from "lucide-react";

import illustrationUrl from "@/assets/illustration-dossier.svg";
import {
  computeProgressPercent,
  formatVoletsLabel,
  type DossierProgress,
} from "../domain/progress";
import { STATUT_DOSSIER, type StatutDossier } from "../domain/statut-dossier";

interface StatutTag {
  label: string;
  status: NonNullable<ComponentProps<typeof Tag>["status"]>;
  Icon: LucideIcon;
}

const STATUT_TAGS: Record<StatutDossier, StatutTag> = {
  [STATUT_DOSSIER.BROUILLON]: {
    label: "Saisie en cours",
    status: "warning",
    Icon: ClockIcon,
  },
};

export interface DossierHeaderProps {
  title: string;
  subtitle: string;
  numero: string;
  statut: StatutDossier;
  updatedAtLabel: string | null;
  progress: DossierProgress;
}

/** En-tête d'un dossier : intitulé, numéro, statut et avancement de la saisie. */
export function DossierHeader({
  title,
  subtitle,
  numero,
  statut,
  updatedAtLabel,
  progress,
}: DossierHeaderProps) {
  const progressLabelId = useId();
  const { label, status, Icon } = STATUT_TAGS[statut];

  return (
    <header className="bg-surface-warm">
      <Container size="app" className="relative flex flex-col gap-4 pt-9 pb-31">
        <img
          src={illustrationUrl}
          alt=""
          width={246}
          height={204}
          className="absolute top-10.5 right-58 hidden xl:block"
        />
        <div className="flex flex-col items-start gap-2">
          <Button asChild variant="link" size="inline">
            <Link to={HOME_PATH}>
              <ArrowLeftIcon aria-hidden="true" />
              Mes dossiers
            </Link>
          </Button>
          <h1 className="font-heading text-heading-lg text-foreground">{title}</h1>
          <p className="font-heading text-heading-md text-primary">{subtitle}</p>
        </div>
        <div className="flex items-center gap-5">
          <Badge variant="inverse" size="xl">
            <FolderOpenIcon aria-hidden="true" />
            Dossier n°{numero}
          </Badge>
          <p
            role="status"
            className="text-content-strong flex items-center gap-2 text-sm font-medium"
          >
            {updatedAtLabel && (
              <>
                <CheckIcon aria-hidden="true" className="size-4" />
                Enregistré automatiquement {updatedAtLabel}
              </>
            )}
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4">
            <p id={progressLabelId} className="text-muted-foreground text-sm font-medium">
              <span className="text-foreground">{progress.completed}</span>{" "}
              {formatVoletsLabel(progress)}
            </p>
            <Tag status={status} importance="emphasized">
              <Icon aria-hidden="true" />
              {label}
            </Tag>
          </div>
          <Progress value={computeProgressPercent(progress)} aria-labelledby={progressLabelId} />
        </div>
      </Container>
    </header>
  );
}
