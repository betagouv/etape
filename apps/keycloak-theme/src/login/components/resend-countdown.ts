const SECONDS_PER_MINUTE = 60;

export const RESEND_STATE = {
  WAITING: "waiting",
  JUST_RESENT: "just-resent",
  AVAILABLE: "available",
  READY: "ready",
} as const;

export type ResendState = (typeof RESEND_STATE)[keyof typeof RESEND_STATE];

type AnnouncementKey = "etapeResendDone" | "etapeResendAvailable";

export const RESEND_ANNOUNCEMENTS: Record<ResendState, AnnouncementKey | undefined> = {
  [RESEND_STATE.WAITING]: undefined,
  [RESEND_STATE.JUST_RESENT]: "etapeResendDone",
  [RESEND_STATE.AVAILABLE]: "etapeResendAvailable",
  [RESEND_STATE.READY]: undefined,
};

export const RESEND_AVAILABILITY: Record<ResendState, boolean> = {
  [RESEND_STATE.WAITING]: false,
  [RESEND_STATE.JUST_RESENT]: false,
  [RESEND_STATE.AVAILABLE]: true,
  [RESEND_STATE.READY]: true,
};

/**
 * Le renvoi et la fin du délai ne sont annoncés qu'une fois le compte à rebours
 * parti : une région déjà remplie au chargement de la page ne serait pas lue
 * (`READY` : délai déjà écoulé à l'ouverture, rien à annoncer).
 */
export function getResendState(
  remainingSeconds: number,
  initialSeconds: number,
  isResent: boolean,
): ResendState {
  if (remainingSeconds <= 0)
    return initialSeconds > 0 ? RESEND_STATE.AVAILABLE : RESEND_STATE.READY;
  return isResent && remainingSeconds < initialSeconds
    ? RESEND_STATE.JUST_RESENT
    : RESEND_STATE.WAITING;
}

export function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const rest = seconds % SECONDS_PER_MINUTE;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}
