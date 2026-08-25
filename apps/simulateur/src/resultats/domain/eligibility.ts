// Moteur d'éligibilité : évalue TOUT le catalogue pour un profil, puis classe
// chaque dispositif dans un des trois onglets à partir du statut de ses
// critères. Aucun dispositif n'est écarté en silence : celui dont une condition
// d'entrée n'est pas remplie remonte dans « Non éligible », motif à l'appui.

import type { FlagSet } from "@/questionnaire/domain/flags";
import type { RegionCode } from "@/questionnaire/domain/regions";

import { DEVICES } from "./devices";
import type { Critere, Device, DeviceLink, Tier } from "./types";

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
  /** Liens résolus (0, 1 ou plusieurs) — voir `resolveLinks`. */
  liens: DeviceLink[];
  criteres: Critere[];
  tier: Tier;
  priorite: number;
}

/**
 * Normalise le lien d'un dispositif en liste prête à l'affichage : URL simple,
 * lien régionalisé (résolu ici), ou déclinaison déjà multi-liens.
 */
function resolveLinks(url: Device["url"], region: RegionCode | null): DeviceLink[] {
  if (!url) return [];
  if (typeof url === "string") return [{ url }];
  if (typeof url === "function") return [{ url: url(region) }];
  return url;
}

/** Évalue tout le catalogue pour ce profil, trié par priorité. */
export function evaluateDevices(flags: FlagSet, region: RegionCode | null): EvaluatedDevice[] {
  return DEVICES.map((device) => {
    const criteres = device.criteres(flags);
    return {
      device,
      acteur: typeof device.acteur === "function" ? device.acteur(flags) : device.acteur,
      liens: resolveLinks(device.url, region),
      criteres,
      tier: tierFromCriteres(criteres),
      priorite: device.priorite(flags),
    };
  }).sort((a, b) => a.priorite - b.priorite);
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
