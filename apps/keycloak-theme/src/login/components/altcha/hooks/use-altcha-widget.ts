import type { RefObject } from "react";

import type { I18n } from "../../../i18n";
import { ANNOUNCEMENTS, WIDGET_STATE } from "../widget-state";
import { useCheckbox } from "./use-checkbox";
import { useWidgetState } from "./use-widget-state";

export interface UseAltchaWidgetResult {
  widgetRef: RefObject<HTMLElement | null>;
  error: string | undefined;
  announcement: string;
}

/** Suit le widget ALTCHA et compense ce qu'il ne fait pas : annoncer ses états, expliquer un envoi bloqué, relier la case à son erreur. */
export function useAltchaWidget(
  serverError: string | undefined,
  i18n: I18n,
): UseAltchaWidgetResult {
  const { msgStr } = i18n;

  const { widgetRef, state, blockedSubmitKey } = useWidgetState();
  const blockedSubmitError = blockedSubmitKey === undefined ? undefined : msgStr(blockedSubmitKey);
  const visibleServerError = state === WIDGET_STATE.UNVERIFIED ? serverError : undefined;
  const error = blockedSubmitError ?? visibleServerError;
  const announcementKey = ANNOUNCEMENTS[state];

  useCheckbox(widgetRef, error !== undefined, serverError !== undefined);

  return {
    widgetRef,
    error,
    announcement: announcementKey === undefined ? "" : msgStr(announcementKey),
  };
}
