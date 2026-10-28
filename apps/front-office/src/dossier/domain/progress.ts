const TIME_FORMAT = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
const DAY_FORMAT = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" });
const PLURAL_RULES = new Intl.PluralRules("fr-FR");

interface VoletLabelForms {
  noun: string;
  participle: string;
}

const VOLET_LABELS: Partial<Record<Intl.LDMLPluralRule, VoletLabelForms>> &
  Record<"other", VoletLabelForms> = {
  one: { noun: "section", participle: "complétée" },
  other: { noun: "sections", participle: "complétées" },
};

/** Avancement de la saisie d'un dossier, en volets. */
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

/** Suite du libellé d'avancement, après le nombre de volets complétés que la vue met en valeur. */
export function formatVoletsLabel({ completed, total }: DossierProgress): string {
  const { noun, participle } = VOLET_LABELS[PLURAL_RULES.select(completed)] ?? VOLET_LABELS.other;
  return `${noun} sur ${total} ${participle}`;
}

/** Part des volets complétés, de 0 à 100. */
export function computeProgressPercent({ completed, total }: DossierProgress): number {
  return total === 0 ? 0 : (completed / total) * 100;
}
