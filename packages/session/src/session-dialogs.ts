import {
  describeSessionEnding,
  PRESENCE_CHECK_FAILURE_MESSAGE,
  PRESENCE_CHECK_NOTICE,
  SESSION_END_CAUSE,
  type SessionEndCause,
} from "@etape/api-client";
import type { SessionDialogProps } from "@etape/ui/components/session-dialog";

import type { SessionWarning } from "./use-session-activity";

interface WarningActions {
  reconnectHref: string;
  confirmPresence: () => void;
  isConfirming: boolean;
  hasConfirmFailed: boolean;
}

type WarningDialog = Omit<SessionDialogProps, "open">;

const WARNING_DIALOGS: Record<
  SessionEndCause,
  (warning: SessionWarning, actions: WarningActions) => WarningDialog
> = {
  // « Oui » prolonge la session, sans quitter la page.
  [SESSION_END_CAUSE.IDLE]: (_, { confirmPresence, isConfirming, hasConfirmFailed }) => ({
    ...PRESENCE_CHECK_NOTICE,
    action: {
      onClick: confirmPresence,
      isBusy: isConfirming,
      failureMessage: hasConfirmFailed ? PRESENCE_CHECK_FAILURE_MESSAGE : "",
    },
  }),
  // Rien ne repousse la durée maximale : seule une nouvelle connexion.
  [SESSION_END_CAUSE.MAX_DURATION]: ({ maxDurationMs }, { reconnectHref }) => ({
    ...describeSessionEnding(maxDurationMs),
    action: { href: reconnectHref },
  }),
};

/** Le dialogue d'avertissement selon la fin qui approche. */
export function describeWarningDialog(
  warning: SessionWarning,
  actions: WarningActions,
): WarningDialog {
  return WARNING_DIALOGS[warning.cause](warning, actions);
}

/** Annoncé une fois la session prolongée par « Oui ». */
export const SESSION_EXTENDED_MESSAGE = "Votre session est prolongée.";
