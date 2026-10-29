const SECONDS_PER_MINUTE = 60;

export const RESEND_STATE = {
  WAITING: "waiting",
  JUST_RESENT: "just-resent",
  AVAILABLE: "available",
} as const;

export type ResendState = (typeof RESEND_STATE)[keyof typeof RESEND_STATE];

type AnnouncementKey = "etapeResendDone" | "etapeResendAvailable";

export const RESEND_ANNOUNCEMENTS: Record<ResendState, AnnouncementKey | undefined> = {
  [RESEND_STATE.WAITING]: undefined,
  [RESEND_STATE.JUST_RESENT]: "etapeResendDone",
  [RESEND_STATE.AVAILABLE]: "etapeResendAvailable",
};

/**
 * Le renvoi n'est annoncé qu'une fois le compte à rebours parti : une région
 * déjà remplie au chargement de la page ne serait pas lue.
 */
export function getResendState(
  remainingSeconds: number,
  initialSeconds: number,
  isResent: boolean,
): ResendState {
  if (remainingSeconds <= 0) return RESEND_STATE.AVAILABLE;
  return isResent && remainingSeconds < initialSeconds
    ? RESEND_STATE.JUST_RESENT
    : RESEND_STATE.WAITING;
}

export function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const rest = seconds % SECONDS_PER_MINUTE;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}
