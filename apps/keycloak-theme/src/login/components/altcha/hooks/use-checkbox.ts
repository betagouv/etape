import { useEffect, type RefObject } from "react";

export const ERROR_ID = "input-error-altcha";

const CHECKBOX_SELECTOR = 'input[type="checkbox"]';

/** Attributs ARIA et focus de la case, que le widget crée lui-même ; ne s'appelle qu'au travers de `useAltchaWidget`. */
export function useCheckbox(
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
