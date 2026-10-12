import "altcha";
import "altcha/i18n/fr-fr";
import type {} from "altcha/types/react";
import { useEffect, useRef, useState, type RefObject } from "react";

import type { I18n } from "../i18n";
import { FieldError } from "./form";

const ALTCHA_FIELD = "altcha";

const ERROR_ID = "input-error-altcha";

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

interface UseAltchaResult {
  widgetRef: RefObject<HTMLElement | null>;
  state: WidgetState;
  isUnchecked: boolean;
}

function useAltcha(): UseAltchaResult {
  const widgetRef = useRef<HTMLElement>(null);
  const [state, setState] = useState<WidgetState>(WIDGET_STATE.UNVERIFIED);
  const [isUnchecked, setIsUnchecked] = useState(false);

  useEffect(() => {
    const widget = widgetRef.current;
    if (widget === null) return;

    const handleStateChange = (event: Event) => {
      setState((event as CustomEvent<{ state: WidgetState }>).detail.state);
      setIsUnchecked(false);
    };
    const handleInvalid = (event: Event) => {
      event.preventDefault();
      setIsUnchecked(true);
      (event.target as HTMLElement).focus();
    };

    widget.addEventListener("statechange", handleStateChange);
    widget.addEventListener("invalid", handleInvalid, true);
    return () => {
      widget.removeEventListener("statechange", handleStateChange);
      widget.removeEventListener("invalid", handleInvalid, true);
    };
  }, []);

  return { widgetRef, state, isUnchecked };
}

function useCheckboxDescription(widgetRef: RefObject<HTMLElement | null>, hasError: boolean): void {
  useEffect(() => {
    const checkbox = widgetRef.current?.querySelector('input[type="checkbox"]');
    if (checkbox === null || checkbox === undefined) return;

    checkbox.setAttribute("aria-invalid", String(hasError));
    if (hasError) {
      checkbox.setAttribute("aria-describedby", ERROR_ID);
    } else {
      checkbox.removeAttribute("aria-describedby");
    }
  }, [widgetRef, hasError]);
}

export function AltchaField(props: { challenge: string; serverError?: string; i18n: I18n }) {
  const { challenge, serverError, i18n } = props;
  const { msgStr, currentLanguage } = i18n;

  const { widgetRef, state, isUnchecked } = useAltcha();
  const isVerified = state === WIDGET_STATE.VERIFIED;
  const uncheckedError = isUnchecked ? msgStr("etapeAltchaRequired") : undefined;
  const error = isVerified ? undefined : (uncheckedError ?? serverError);
  const announcement = ANNOUNCEMENTS[state];

  useCheckboxDescription(widgetRef, error !== undefined);

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
