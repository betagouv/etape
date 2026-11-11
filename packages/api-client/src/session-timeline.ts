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
 * Le temps restant est calculé par le serveur, puis reçu après le trajet de la
 * réponse : vue du front, une échéance peut se décaler d'autant. Cette marge
 * absorbe le décalage.
 */
const CLOCK_TOLERANCE_MS = 5 * 1000;

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

/**
 * La fin est assez proche pour avertir. La marge absorbe le trajet de la
 * réponse : relue juste à l'heure de l'avertissement, l'échéance peut sembler
 * à peine plus lointaine que le délai.
 */
export function isSessionEndNear(end: SessionEnd, now: number): boolean {
  return end.at - now <= SESSION_WARNING_DELAY_MS + CLOCK_TOLERANCE_MS;
}

/**
 * Une réponse dépassée par une autre déjà reçue : sa fin d'inactivité vient
 * avant celle qu'on connaît. Deux requêtes parties ensemble (prolongation et
 * relecture) peuvent revenir dans le désordre, et la relecture, plus ancienne,
 * annoncerait une fin proche qui n'est plus vraie. La fin d'inactivité ne
 * recule jamais, sauf à changer de session, ce qui passe par un rechargement.
 */
export function isStaleExpiry(
  fresh: SessionExpiry,
  freshReceivedAt: number,
  known: SessionExpiry,
  knownReceivedAt: number,
): boolean {
  const freshIdleEndsAt = freshReceivedAt + fresh.idleRemainingMs;
  const knownIdleEndsAt = knownReceivedAt + known.idleRemainingMs;

  return freshIdleEndsAt < knownIdleEndsAt - CLOCK_TOLERANCE_MS;
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
  if (now < end.at - CLOCK_TOLERANCE_MS) return null;

  return { cause: end.cause, durationMs: expiry[DURATION_BY_CAUSE[end.cause]] };
}
