import type { DossierHeaderProps } from "./components/dossier-header";
import { computeDossierProgress } from "./domain/progress";
import { STATUT_DOSSIER } from "./domain/statut-dossier";
import type { VoletProgress } from "./domain/statut-volet";
import { formatUpdatedAt } from "./domain/updated-at";
import type { VoletError } from "./domain/volet-errors";
import { VOLET_ID, type VoletId } from "./domain/volet-id";
import type { Volet } from "./domain/volets";
import { VOLETS_DOSSIER } from "./domain/volets-dossier";

// Données de la maquette, en attendant celles de l'API.

type VoletProgressDemo = Omit<VoletProgress, "errorCount">;

export const VOLET_ERRORS_DEMO: Record<VoletId, VoletError[]> = {
  // Les erreurs de la maquette « Mes informations / Liste d'erreurs ».
  [VOLET_ID.INFORMATIONS]: [
    { fieldId: "numero-securite-sociale", message: "Le numéro de carte Vitale n’est pas valide." },
    { fieldId: "cle", message: "La clé de votre carte Vitale n’est pas valide." },
    { fieldId: "code-postal", message: "Le code postal se trouve dans une autre région." },
  ],
  [VOLET_ID.SITUATION_PROFESSIONNELLE]: [],
  [VOLET_ID.FUTUR_METIER]: [],
  [VOLET_ID.PROJET]: [],
  [VOLET_ID.FORMATION]: [],
  [VOLET_ID.CEP]: [],
  [VOLET_ID.DOCUMENTS]: [],
};

function createEmptyVoletProgress(requiredFieldCount: number): VoletProgressDemo {
  return {
    requiredFieldCount,
    filledFieldCount: 0,
    remainingFieldCount: requiredFieldCount,
  };
}

const VOLET_PROGRESS_DEMO: Record<VoletId, VoletProgressDemo> = {
  // Seule la commune reste vide dans la maquette.
  [VOLET_ID.INFORMATIONS]: {
    requiredFieldCount: 12,
    filledFieldCount: 11,
    remainingFieldCount: 1,
  },
  [VOLET_ID.SITUATION_PROFESSIONNELLE]: {
    requiredFieldCount: 3,
    filledFieldCount: 3,
    remainingFieldCount: 0,
  },
  [VOLET_ID.FUTUR_METIER]: {
    requiredFieldCount: 9,
    filledFieldCount: 3,
    remainingFieldCount: 6,
  },
  [VOLET_ID.PROJET]: createEmptyVoletProgress(5),
  [VOLET_ID.FORMATION]: createEmptyVoletProgress(15),
  [VOLET_ID.CEP]: createEmptyVoletProgress(1),
  [VOLET_ID.DOCUMENTS]: createEmptyVoletProgress(4),
};

export const VOLETS_DEMO: Volet[] = VOLETS_DOSSIER.map((volet) => ({
  ...volet,
  ...VOLET_PROGRESS_DEMO[volet.id],
  errorCount: VOLET_ERRORS_DEMO[volet.id].length,
}));

const updatedAt = new Date();
updatedAt.setHours(14, 32, 0, 0);

export const DOSSIER_DEMO: DossierHeaderProps = {
  title: "Démission-reconversion",
  subtitle: "Projet de formation",
  numero: "123456",
  statut: STATUT_DOSSIER.BROUILLON,
  updatedAtLabel: formatUpdatedAt(updatedAt, new Date()),
  progress: computeDossierProgress(VOLETS_DEMO),
};
