export const WIDGET_STATE = {
  UNVERIFIED: "unverified",
  VERIFYING: "verifying",
  VERIFIED: "verified",
  EXPIRED: "expired",
  ERROR: "error",
  CODE: "code",
} as const;

export type WidgetState = (typeof WIDGET_STATE)[keyof typeof WIDGET_STATE];

type AnnouncementKey = "etapeAltchaVerifying" | "etapeAltchaVerified";

export const ANNOUNCEMENTS: Record<WidgetState, AnnouncementKey | undefined> = {
  [WIDGET_STATE.UNVERIFIED]: undefined,
  [WIDGET_STATE.VERIFYING]: "etapeAltchaVerifying",
  [WIDGET_STATE.VERIFIED]: "etapeAltchaVerified",
  [WIDGET_STATE.EXPIRED]: undefined,
  [WIDGET_STATE.ERROR]: undefined,
  [WIDGET_STATE.CODE]: undefined,
};

export type BlockedSubmitKey = "etapeAltchaRequired" | "etapeAltchaPending" | "etapeAltchaFailed";

interface BlockedSubmitResponse {
  messageKey: BlockedSubmitKey;
  shouldFocusCheckbox: boolean;
}

/** Réponse à un envoi bloqué par la case ; pendant le calcul, la case est invisible et ne prend pas le focus. */
export const BLOCKED_SUBMIT_RESPONSES: Record<WidgetState, BlockedSubmitResponse> = {
  [WIDGET_STATE.UNVERIFIED]: { messageKey: "etapeAltchaRequired", shouldFocusCheckbox: true },
  [WIDGET_STATE.VERIFYING]: { messageKey: "etapeAltchaPending", shouldFocusCheckbox: false },
  [WIDGET_STATE.VERIFIED]: { messageKey: "etapeAltchaRequired", shouldFocusCheckbox: true },
  [WIDGET_STATE.EXPIRED]: { messageKey: "etapeAltchaFailed", shouldFocusCheckbox: true },
  [WIDGET_STATE.ERROR]: { messageKey: "etapeAltchaFailed", shouldFocusCheckbox: true },
  [WIDGET_STATE.CODE]: { messageKey: "etapeAltchaRequired", shouldFocusCheckbox: true },
};
