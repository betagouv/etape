import { useId } from "react";

import { HOME_PATH } from "@etape/session";
import { Badge, type badgeVariants } from "@etape/ui/components/badge";
import { Button } from "@etape/ui/components/button";
import { Container } from "@etape/ui/components/container";
import { Progress } from "@etape/ui/components/progress";
import { Link } from "@tanstack/react-router";
import type { VariantProps } from "class-variance-authority";
import { ArrowLeftIcon, CheckIcon, ClockIcon, FolderOpenIcon, type LucideIcon } from "lucide-react";

import illustrationUrl from "@/assets/illustration-jumelles.svg";
import { STATUT_DOSSIER, type StatutDossier } from "../domain/statut-dossier";

interface StatutBadge {
  label: string;
  variant: VariantProps<typeof badgeVariants>["variant"];
  Icon: LucideIcon;
}

const STATUT_BADGES: Record<StatutDossier, StatutBadge> = {
  [STATUT_DOSSIER.BROUILLON]: {
    label: "Saisie en cours",
    variant: "warning-solid",
    Icon: ClockIcon,
  },
};

const TIME_FORMAT = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
const DAY_FORMAT = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" });

function formatUpdatedAt(updatedAt: Date, now: Date): string {
  const time = TIME_FORMAT.format(updatedAt);
  if (updatedAt.toDateString() === now.toDateString()) return `à ${time}`;
  return `le ${DAY_FORMAT.format(updatedAt)} à ${time}`;
}

interface DossierProgress {
  completed: number;
  total: number;
}

export interface DossierHeaderProps {
  title: string;
  subtitle: string;
  numero: string;
  statut: StatutDossier;
  /** `null` tant que rien n'a été enregistré : la mention est alors masquée. */
  updatedAt: Date | null;
  progress: DossierProgress;
}

/** En-tête d'un dossier : intitulé, numéro, statut et avancement de la saisie. */
export function DossierHeader({
  title,
  subtitle,
  numero,
  statut,
  updatedAt,
  progress,
}: DossierHeaderProps) {
  const progressLabelId = useId();
  const { label, variant, Icon } = STATUT_BADGES[statut];
  const isPlural = progress.completed > 1;
  const percent = progress.total === 0 ? 0 : (progress.completed / progress.total) * 100;

  return (
    <header className="bg-surface-warm">
      <Container size="app" className="relative flex flex-col gap-4 pt-9 pb-31">
        <img
          src={illustrationUrl}
          alt=""
          width={230}
          height={191}
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
          {updatedAt && (
            <p className="text-content-strong flex items-center gap-2 text-sm font-medium">
              <CheckIcon aria-hidden="true" className="size-4" />
              Enregistré automatiquement {formatUpdatedAt(updatedAt, new Date())}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4">
            <p id={progressLabelId} className="text-muted-foreground text-sm font-medium">
              <span className="text-foreground">{progress.completed}</span>{" "}
              {isPlural ? "sections" : "section"} sur {progress.total}{" "}
              {isPlural ? "complétées" : "complétée"}
            </p>
            <Badge variant={variant} size="xl">
              <Icon aria-hidden="true" />
              {label}
            </Badge>
          </div>
          <Progress value={percent} aria-labelledby={progressLabelId} />
        </div>
      </Container>
    </header>
  );
}
