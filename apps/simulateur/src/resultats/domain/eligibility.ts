// Moteur d'éligibilité : filtre les dispositifs pertinents pour un profil, puis
// les classe dans un des trois onglets à partir du statut de leurs critères.

import type { FlagSet } from "@/questionnaire/domain/flags";

import { DEVICES } from "./devices";
import type { Critere, Device, Tier } from "./types";

/** Ordre des onglets (du plus favorable au moins favorable). */
export const TIERS = ["eligible", "sous-reserve", "non-eligible"] as const;

/**
 * Onglet d'un dispositif, dérivé du « pire » statut de ses critères :
 * un critère bloquant non rempli → Non éligible ; sinon un critère à vérifier →
 * Sous réserve ; sinon tous validés → Éligible.
 */
export function tierFromCriteres(criteres: Critere[]): Tier {
  if (criteres.some((c) => c.statut === "manquant")) return "non-eligible";
  if (criteres.some((c) => c.statut === "a-verifier")) return "sous-reserve";
  return "eligible";
}

export interface EvaluatedDevice {
  device: Device;
  acteur: string;
  criteres: Critere[];
  tier: Tier;
  priorite: number;
}

/** Évalue tous les dispositifs pertinents pour ce profil, triés par priorité. */
export function evaluateDevices(flags: FlagSet): EvaluatedDevice[] {
  return DEVICES.filter((device) => device.relevant(flags))
    .map((device) => {
      const criteres = device.criteres(flags);
      return {
        device,
        acteur: typeof device.acteur === "function" ? device.acteur(flags) : device.acteur,
        criteres,
        tier: tierFromCriteres(criteres),
        priorite: device.priorite(flags),
      };
    })
    .sort((a, b) => a.priorite - b.priorite);
}

/** Regroupe les dispositifs évalués par onglet, en conservant l'ordre de tri. */
export function groupByTier(evaluated: EvaluatedDevice[]): Record<Tier, EvaluatedDevice[]> {
  return {
    eligible: evaluated.filter((e) => e.tier === "eligible"),
    "sous-reserve": evaluated.filter((e) => e.tier === "sous-reserve"),
    "non-eligible": evaluated.filter((e) => e.tier === "non-eligible"),
  };
}

/** Libellés d'onglet affichés à l'utilisateur. */
export const TIER_LABELS: Record<Tier, string> = {
  eligible: "Éligibles",
  "sous-reserve": "Sous réserve",
  "non-eligible": "Non éligible",
};
