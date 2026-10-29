import { type FormEvent, useEffect, useState } from "react";

import type { I18n } from "../i18n";
import {
  formatCountdown,
  getResendState,
  RESEND_ANNOUNCEMENTS,
  RESEND_STATE,
} from "../components/resend-countdown";

const TICK_MS = 1000;

interface UseResendCountdownOptions {
  initialSeconds: number;
  isResent: boolean;
  i18n: I18n;
}

export interface UseResendCountdownResult {
  isAvailable: boolean;
  isSubmitting: boolean;
  remainingLabel: string;
  announcement: string;
  submit: (event: FormEvent<HTMLFormElement>) => void;
}

/** Compte à rebours du renvoi, calé sur l'heure de fin : un onglet en arrière-plan ralentit les minuteries. */
export function useResendCountdown(options: UseResendCountdownOptions): UseResendCountdownResult {
  const { initialSeconds, isResent, i18n } = options;

  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialSeconds <= 0) return;
    const deadline = Date.now() + initialSeconds * TICK_MS;
    const interval = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / TICK_MS));
      setRemainingSeconds(seconds);
      if (seconds === 0) window.clearInterval(interval);
    }, TICK_MS);
    return () => window.clearInterval(interval);
  }, [initialSeconds]);

  const state = getResendState(remainingSeconds, initialSeconds, isResent);
  const isAvailable = state === RESEND_STATE.AVAILABLE;
  const announcementKey = RESEND_ANNOUNCEMENTS[state];

  return {
    isAvailable,
    isSubmitting,
    remainingLabel: formatCountdown(remainingSeconds),
    announcement: announcementKey === undefined ? "" : i18n.msgStr(announcementKey),
    submit: (event) => {
      if (!isAvailable || isSubmitting) {
        event.preventDefault();
        return;
      }
      setIsSubmitting(true);
    },
  };
}
