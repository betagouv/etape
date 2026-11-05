import { selectPlural, type PluralForms } from "@/lib/plural";
import { isVoletCompleted, type VoletProgress } from "./statut-volet";

/** Avancement de la saisie d'un dossier, en volets. */
export interface DossierProgress {
  completed: number;
  total: number;
}

interface VoletLabelForms {
  noun: string;
  participle: string;
}

const VOLET_LABELS: PluralForms<VoletLabelForms> = {
  one: { noun: "section", participle: "complétée" },
  other: { noun: "sections", participle: "complétées" },
};

export function computeDossierProgress(volets: VoletProgress[]): DossierProgress {
  return {
    completed: volets.filter(isVoletCompleted).length,
    total: volets.length,
  };
}

/** Suite du libellé d'avancement, après le nombre de volets complétés que la vue met en valeur. */
export function formatVoletsLabel({ completed, total }: DossierProgress): string {
  const { noun, participle } = selectPlural(completed, VOLET_LABELS);
  return `${noun} sur ${total} ${participle}`;
}

/** Part des volets complétés, de 0 à 100. */
export function computeProgressPercent({ completed, total }: DossierProgress): number {
  return total === 0 ? 0 : (completed / total) * 100;
}
