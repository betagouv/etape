import type { VoletProgress } from "./statut-volet";
import { VOLET_ID, type VoletId } from "./volet-id";

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

export interface Volet extends VoletDefinition, VoletProgress {}

export interface VoletPosition {
  index: number;
  current: VoletDefinition;
  previous: VoletDefinition | undefined;
  next: VoletDefinition | undefined;
}

const VOLET_IDS: readonly string[] = Object.values(VOLET_ID);

/** Un segment d'adresse ne désigne un volet que s'il en est l'identifiant. */
export function isVoletId(value: string): value is VoletId {
  return VOLET_IDS.includes(value);
}

/** Le volet et ses voisins dans l'ordre du dossier ; `null` si le dossier ne compte pas ce volet. */
export function findVoletPosition(
  volets: VoletDefinition[],
  voletId: VoletId,
): VoletPosition | null {
  const index = volets.findIndex((volet) => volet.id === voletId);
  if (index < 0) return null;

  return { index, current: volets[index], previous: volets[index - 1], next: volets[index + 1] };
}
