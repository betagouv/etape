import type { NoticeContent } from "./auth-flow-messages";
import {
  SESSION_END_CAUSE,
  SESSION_WARNING_DELAY_MS,
  type SessionEndCause,
  type SessionEndNotice,
} from "./session-timeline";

// Les textes des dialogues de session, communs à front-office et back-office.
// Les durées viennent de la règle du front renvoyée par l'API : aucun texte ne
// fige « 30 minutes ». La vue reste générique dans `packages/ui`.

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

/** « 30 minutes », « 1 heure », « 10 heures ». */
export function formatDuration(durationMs: number): string {
  const isWholeHours = durationMs % HOUR_MS === 0;
  const count = isWholeHours ? durationMs / HOUR_MS : Math.round(durationMs / MINUTE_MS);
  const unit = isWholeHours ? "heure" : "minute";

  return `${count} ${unit}${count > 1 ? "s" : ""}`;
}

const WARNING_DELAY = formatDuration(SESSION_WARNING_DELAY_MS);

const RECONNECT_LABEL = "Se reconnecter";

/** Avant la fin d'inactivité : seul « Oui » prolonge la session. */
export const PRESENCE_CHECK_NOTICE: NoticeContent = {
  title: "Êtes-vous toujours là ?",
  message: `Sans réponse de votre part, votre session expirera dans ${WARNING_DELAY}.`,
  actionLabel: "Oui",
};

/** Avant la durée maximale : rien ne la repousse, une reconnexion repart de zéro. */
export function describeSessionEnding(maxDurationMs: number): NoticeContent {
  return {
    title: "Votre session se termine bientôt",
    message: `Elle atteindra dans ${WARNING_DELAY} sa durée maximale de ${formatDuration(maxDurationMs)}. Reconnectez-vous pour en ouvrir une nouvelle.`,
    actionLabel: RECONNECT_LABEL,
  };
}

const SESSION_END_MESSAGES: Record<SessionEndCause, (duration: string) => string> = {
  [SESSION_END_CAUSE.IDLE]: (duration) =>
    `Votre session a expiré après ${duration} d'inactivité. Veuillez vous reconnecter pour continuer.`,
  [SESSION_END_CAUSE.MAX_DURATION]: (duration) =>
    `Votre session a atteint sa durée maximale de ${duration}. Veuillez vous reconnecter pour continuer.`,
};

/** La cause quand elle est connue ; sinon, le seul constat. */
export function describeSessionEnd(notice: SessionEndNotice | null): NoticeContent {
  return {
    title: "Votre session a expiré",
    message: notice
      ? SESSION_END_MESSAGES[notice.cause](formatDuration(notice.durationMs))
      : "Veuillez vous reconnecter pour continuer.",
    actionLabel: RECONNECT_LABEL,
  };
}
