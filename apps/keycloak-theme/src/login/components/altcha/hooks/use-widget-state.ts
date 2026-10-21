import { useEffect, useRef, useState, type RefObject } from "react";

import {
  BLOCKED_SUBMIT_RESPONSES,
  WIDGET_STATE,
  type BlockedSubmitKey,
  type WidgetState,
} from "../widget-state";

export interface UseWidgetStateResult {
  widgetRef: RefObject<HTMLElement | null>;
  state: WidgetState;
  blockedSubmitKey: BlockedSubmitKey | undefined;
}

/** État du widget et envoi bloqué par la case ; ne s'appelle qu'au travers de `useAltchaWidget`. */
export function useWidgetState(): UseWidgetStateResult {
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
