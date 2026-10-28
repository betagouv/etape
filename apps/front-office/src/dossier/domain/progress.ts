const TIME_FORMAT = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
const DAY_FORMAT = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" });
const PLURAL_RULES = new Intl.PluralRules("fr-FR");

interface SectionsForms {
  section: string;
  completee: string;
}

const SECTIONS_FORMS: Partial<Record<Intl.LDMLPluralRule, SectionsForms>> &
  Record<"other", SectionsForms> = {
  one: { section: "section", completee: "complétée" },
  other: { section: "sections", completee: "complétées" },
};

/** Avancement de la saisie d'un dossier, en sections. */
export interface DossierProgress {
  completed: number;
  total: number;
}

/** Moment du dernier enregistrement : l'heure seule le jour même, sinon la date et l'heure. */
export function formatUpdatedAt(updatedAt: Date, now: Date): string {
  const time = TIME_FORMAT.format(updatedAt);
  if (updatedAt.toDateString() === now.toDateString()) return `à ${time}`;
  return `le ${DAY_FORMAT.format(updatedAt)} à ${time}`;
}

/** Suite du libellé d'avancement, après le nombre de sections complétées que la vue met en valeur. */
export function formatSectionsLabel({ completed, total }: DossierProgress): string {
  const { section, completee } =
    SECTIONS_FORMS[PLURAL_RULES.select(completed)] ?? SECTIONS_FORMS.other;
  return `${section} sur ${total} ${completee}`;
}

/** Part des sections complétées, de 0 à 100. */
export function computeProgressPercent({ completed, total }: DossierProgress): number {
  return total === 0 ? 0 : (completed / total) * 100;
}
