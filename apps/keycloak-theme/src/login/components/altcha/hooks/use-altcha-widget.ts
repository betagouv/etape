import { useState } from "react";

import type { I18n } from "../../../i18n";
import { describeCheckbox, focusCheckbox } from "../checkbox";
import {
  ANNOUNCEMENTS,
  BLOCKED_SUBMIT_RESPONSES,
  WIDGET_STATE,
  getVisibleError,
  type BlockedSubmitKey,
  type WidgetState,
} from "../widget-state";

/** Écouteurs posés par React sur `<altcha-widget>` : en minuscules, React 19 les branche tels quels sur un custom element. */
export interface AltchaWidgetHandlers {
  onload: (event: Event) => void;
  onstatechange: (event: Event) => void;
  oninvalidCapture: (event: Event) => void;
}

export interface UseAltchaWidgetResult {
  handlers: AltchaWidgetHandlers;
  error: string | undefined;
  announcement: string;
}

/** Suit le widget ALTCHA et compense ce qu'il ne fait pas : annoncer ses états, expliquer un envoi bloqué, relier la case à son erreur. */
export function useAltchaWidget(
  serverError: string | undefined,
  i18n: I18n,
): UseAltchaWidgetResult {
  const { msgStr } = i18n;
  const [state, setState] = useState<WidgetState>(WIDGET_STATE.UNVERIFIED);
  const [blockedSubmitKey, setBlockedSubmitKey] = useState<BlockedSubmitKey | undefined>(undefined);

  const blockedSubmitError = blockedSubmitKey === undefined ? undefined : msgStr(blockedSubmitKey);
  const error = getVisibleError(state, blockedSubmitError, serverError);
  const announcementKey = ANNOUNCEMENTS[state];

  const handlers: AltchaWidgetHandlers = {
    onload: (event) => {
      const widget = event.currentTarget as HTMLElement;
      const hasServerError = serverError !== undefined;
      describeCheckbox(widget, hasServerError);
      if (hasServerError) focusCheckbox(widget);
    },
    onstatechange: (event) => {
      const nextState = (event as CustomEvent<{ state: WidgetState }>).detail.state;
      setState(nextState);
      setBlockedSubmitKey(undefined);
      const hasError = getVisibleError(nextState, undefined, serverError) !== undefined;
      describeCheckbox(event.currentTarget as HTMLElement, hasError);
    },
    oninvalidCapture: (event) => {
      event.preventDefault();
      const response = BLOCKED_SUBMIT_RESPONSES[state];
      setBlockedSubmitKey(response.messageKey);
      describeCheckbox(event.currentTarget as HTMLElement, true);
      if (response.shouldFocusCheckbox) {
        (event.target as HTMLElement).focus();
      }
    },
  };

  return {
    handlers,
    error,
    announcement: announcementKey === undefined ? "" : msgStr(announcementKey),
  };
}
