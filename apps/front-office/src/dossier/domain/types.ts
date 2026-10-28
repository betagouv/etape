import type { StatutVolet } from "./statut-volet";
import type { VoletId } from "./volet-id";

/** Encart d'information en tête du volet ; `contactEmail` s'affiche en lien à la fin de la description. */
export interface VoletNoticeContent {
  title: string;
  description: string;
  contactEmail?: string;
}

export interface VoletDefinition {
  id: VoletId;
  label: string;
  title: string;
  description?: string;
  notice?: VoletNoticeContent;
}

/** `requiredFieldCount` et `remainingFieldCount` ne comptent que les champs obligatoires ; `filledFieldCount` les compte tous. */
export interface VoletProgress {
  requiredFieldCount: number;
  filledFieldCount: number;
  remainingFieldCount: number;
  errorCount: number;
}

export interface Volet extends VoletDefinition, VoletProgress {}

export interface VoletPosition {
  index: number;
  current: VoletDefinition;
  previous: VoletDefinition | undefined;
  next: VoletDefinition | undefined;
}

/** Une ligne du statut, avec le statut dont elle prend le libellé et la couleur. */
export interface StatutVoletLine {
  statut: StatutVolet;
  label: string;
}

/** Avancement de la saisie d'un dossier, en volets. */
export interface DossierProgress {
  completed: number;
  total: number;
}

export interface VoletError {
  fieldId: string;
  message: string;
}
