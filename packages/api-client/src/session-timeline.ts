import type { SessionExpiry } from "@etape/api-contract";

/** Pourquoi une session a pris fin, ou va prendre fin. */
export const SESSION_END_CAUSE = {
  /** Plus d'activité depuis le délai du front : « Oui » la prolonge. */
  IDLE: "idle",
  /** Durée maximale atteinte : seule une reconnexion ouvre une session neuve. */
  MAX_DURATION: "max-duration",
} as const;

export type SessionEndCause = (typeof SESSION_END_CAUSE)[keyof typeof SESSION_END_CAUSE];

/** L'avertissement précède la fin de ce délai (WCAG 2.2.1 en exige 20 s au moins). */
export const SESSION_WARNING_DELAY_MS = 2 * 60 * 1000;

/**
 * Un 401 arrive un peu après la fin vue du front : le temps restant est calculé
 * par le serveur, puis reçu après le trajet de la réponse. Cette marge suffit à
 * attribuer la fin à sa cause malgré ce décalage.
 */
const END_CAUSE_TOLERANCE_MS = 5 * 1000;

/** La fin la plus proche, en heure du poste. */
export interface SessionEnd {
  at: number;
  cause: SessionEndCause;
}

/**
 * Les temps restants sont ajoutés à l'heure de réception de la réponse : les
 * dates du serveur dépendraient de l'écart entre son horloge et celle du poste.
 * À égalité, la durée maximale l'emporte : « Oui » ne pourrait pas la repousser.
 */
export function resolveSessionEnd(expiry: SessionExpiry, receivedAt: number): SessionEnd {
  const idleEndsAt = receivedAt + expiry.idleRemainingMs;
  const maxEndsAt = receivedAt + expiry.maxRemainingMs;

  return maxEndsAt <= idleEndsAt
    ? { at: maxEndsAt, cause: SESSION_END_CAUSE.MAX_DURATION }
    : { at: idleEndsAt, cause: SESSION_END_CAUSE.IDLE };
}

/** Ce que le dialogue « Session expirée » peut en dire. */
export interface SessionEndNotice {
  cause: SessionEndCause;
  /** Délai d'inactivité ou durée maximale du front, pour le message. */
  durationMs: number;
}

const DURATION_BY_CAUSE: Record<SessionEndCause, keyof SessionExpiry> = {
  [SESSION_END_CAUSE.IDLE]: "idleTimeoutMs",
  [SESSION_END_CAUSE.MAX_DURATION]: "maxDurationMs",
};

/**
 * La cause d'une fin constatée à `now`, ou `null` si la session ne devait pas
 * encore finir : révoquée ailleurs (déconnexion dans un autre onglet), ou
 * jamais lue. Le dialogue dit alors seulement que la session a expiré.
 */
export function resolveSessionEndNotice(
  expiry: SessionExpiry,
  receivedAt: number,
  now: number,
): SessionEndNotice | null {
  const end = resolveSessionEnd(expiry, receivedAt);
  if (now < end.at - END_CAUSE_TOLERANCE_MS) return null;

  return { cause: end.cause, durationMs: expiry[DURATION_BY_CAUSE[end.cause]] };
}
