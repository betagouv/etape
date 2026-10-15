import "altcha";
import "altcha/i18n/fr-fr";
import type {} from "altcha/types/react";
import { useEffect, useRef, useState, type RefObject } from "react";

import type { I18n } from "../i18n";
import { FieldError } from "./form";

const ALTCHA_FIELD = "altcha";

const ERROR_ID = "input-error-altcha";

const CHECKBOX_SELECTOR = 'input[type="checkbox"]';

const WIDGET_CONFIGURATION = JSON.stringify({
  hideLogo: true,
  hideFooter: true,
  humanInteractionSignature: false,
});

const WIDGET_STATE = {
  UNVERIFIED: "unverified",
  VERIFYING: "verifying",
  VERIFIED: "verified",
  EXPIRED: "expired",
  ERROR: "error",
  CODE: "code",
} as const;

type WidgetState = (typeof WIDGET_STATE)[keyof typeof WIDGET_STATE];

type AnnouncementKey = "etapeAltchaVerifying" | "etapeAltchaVerified";

const ANNOUNCEMENTS: Record<WidgetState, AnnouncementKey | undefined> = {
  [WIDGET_STATE.UNVERIFIED]: undefined,
  [WIDGET_STATE.VERIFYING]: "etapeAltchaVerifying",
  [WIDGET_STATE.VERIFIED]: "etapeAltchaVerified",
  [WIDGET_STATE.EXPIRED]: undefined,
  [WIDGET_STATE.ERROR]: undefined,
  [WIDGET_STATE.CODE]: undefined,
};

type BlockedSubmitKey = "etapeAltchaRequired" | "etapeAltchaPending" | "etapeAltchaFailed";

interface BlockedSubmitResponse {
  messageKey: BlockedSubmitKey;
  shouldFocusCheckbox: boolean;
}

const BLOCKED_SUBMIT_RESPONSES: Record<WidgetState, BlockedSubmitResponse> = {
  [WIDGET_STATE.UNVERIFIED]: { messageKey: "etapeAltchaRequired", shouldFocusCheckbox: true },
  [WIDGET_STATE.VERIFYING]: { messageKey: "etapeAltchaPending", shouldFocusCheckbox: false },
  [WIDGET_STATE.VERIFIED]: { messageKey: "etapeAltchaRequired", shouldFocusCheckbox: true },
  [WIDGET_STATE.EXPIRED]: { messageKey: "etapeAltchaFailed", shouldFocusCheckbox: true },
  [WIDGET_STATE.ERROR]: { messageKey: "etapeAltchaFailed", shouldFocusCheckbox: true },
  [WIDGET_STATE.CODE]: { messageKey: "etapeAltchaRequired", shouldFocusCheckbox: true },
};

interface UseAltchaResult {
  widgetRef: RefObject<HTMLElement | null>;
  state: WidgetState;
  blockedSubmitKey: BlockedSubmitKey | undefined;
}

function useAltcha(): UseAltchaResult {
  const widgetRef = useRef<HTMLElement>(null);
  const stateRef = useRef<WidgetState>(WIDGET_STATE.UNVERIFIED);
  const [state, setState] = useState<WidgetState>(WIDGET_STATE.UNVERIFIED);
  const [blockedSubmitKey, setBlockedSubmitKey] = useState<BlockedSubmitKey | undefined>(undefined);

  useEffect(() => {
    const widget = widgetRef.current;
    if (widget === null) return;

    const handleStateChange = (event: Event) => {
      const nextState = (event as CustomEvent<{ state: WidgetState }>).detail.state;
      stateRef.current = nextState;
      setState(nextState);
      setBlockedSubmitKey(undefined);
    };
    const handleInvalid = (event: Event) => {
      event.preventDefault();
      const response = BLOCKED_SUBMIT_RESPONSES[stateRef.current];
      setBlockedSubmitKey(response.messageKey);
      if (response.shouldFocusCheckbox) {
        (event.target as HTMLElement).focus();
      }
    };

    widget.addEventListener("statechange", handleStateChange);
    widget.addEventListener("invalid", handleInvalid, true);
    return () => {
      widget.removeEventListener("statechange", handleStateChange);
      widget.removeEventListener("invalid", handleInvalid, true);
    };
  }, []);

  return { widgetRef, state, blockedSubmitKey };
}

function useCheckbox(
  widgetRef: RefObject<HTMLElement | null>,
  hasError: boolean,
  shouldFocusOnLoad: boolean,
): void {
  useEffect(() => {
    const widget = widgetRef.current;
    if (widget === null) return;

    const describeError = () => {
      const checkbox = widget.querySelector(CHECKBOX_SELECTOR);
      if (checkbox === null) return;
      checkbox.setAttribute("aria-invalid", String(hasError));
      if (hasError) {
        checkbox.setAttribute("aria-describedby", ERROR_ID);
      } else {
        checkbox.removeAttribute("aria-describedby");
      }
    };

    describeError();
    widget.addEventListener("load", describeError);
    return () => widget.removeEventListener("load", describeError);
  }, [widgetRef, hasError]);

  useEffect(() => {
    const widget = widgetRef.current;
    if (widget === null || !shouldFocusOnLoad) return;

    const focusCheckbox = () => widget.querySelector<HTMLElement>(CHECKBOX_SELECTOR)?.focus();

    if (widget.querySelector(CHECKBOX_SELECTOR) !== null) {
      focusCheckbox();
      return;
    }
    widget.addEventListener("load", focusCheckbox, { once: true });
    return () => widget.removeEventListener("load", focusCheckbox);
  }, [widgetRef, shouldFocusOnLoad]);
}

function AltchaWidget(props: { challenge: string; serverError: string | undefined; i18n: I18n }) {
  const { challenge, serverError, i18n } = props;
  const { msgStr, currentLanguage } = i18n;

  const { widgetRef, state, blockedSubmitKey } = useAltcha();
  const blockedSubmitError = blockedSubmitKey === undefined ? undefined : msgStr(blockedSubmitKey);
  const visibleServerError = state === WIDGET_STATE.UNVERIFIED ? serverError : undefined;
  const error = blockedSubmitError ?? visibleServerError;
  const announcement = ANNOUNCEMENTS[state];

  useCheckbox(widgetRef, error !== undefined, serverError !== undefined);

  return (
    <div className="flex flex-col gap-2">
      <altcha-widget
        ref={widgetRef}
        challenge={challenge}
        name={ALTCHA_FIELD}
        auto="off"
        type="checkbox"
        language={currentLanguage.languageTag}
        configuration={WIDGET_CONFIGURATION}
      />
      <p role="status" className="sr-only">
        {announcement === undefined ? "" : msgStr(announcement)}
      </p>
      <div role="status">{error !== undefined && <FieldError id={ERROR_ID} message={error} />}</div>
    </div>
  );
}

interface AltchaFieldProps {
  challenge: string | undefined;
  isUnavailable: boolean;
  serverError: string | undefined;
  i18n: I18n;
}

export function AltchaField(props: AltchaFieldProps) {
  const { challenge, isUnavailable, serverError, i18n } = props;

  if (challenge !== undefined) {
    return <AltchaWidget challenge={challenge} serverError={serverError} i18n={i18n} />;
  }
  if (!isUnavailable) return null;

  return (
    <div role="status">
      <FieldError id={ERROR_ID} message={i18n.msgStr("etapeAltchaUnavailable")} />
    </div>
  );
}
