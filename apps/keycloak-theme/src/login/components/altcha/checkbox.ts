export const ERROR_ID = "input-error-altcha";

const CHECKBOX_SELECTOR = 'input[type="checkbox"]';

/** Relie la case, que le widget crée lui-même, au message d'erreur affiché sous elle. */
export function describeCheckbox(widget: HTMLElement, hasError: boolean): void {
  const checkbox = widget.querySelector(CHECKBOX_SELECTOR);
  if (checkbox === null) return;
  checkbox.setAttribute("aria-invalid", String(hasError));
  if (hasError) {
    checkbox.setAttribute("aria-describedby", ERROR_ID);
  } else {
    checkbox.removeAttribute("aria-describedby");
  }
}

export function focusCheckbox(widget: HTMLElement): void {
  widget.querySelector<HTMLElement>(CHECKBOX_SELECTOR)?.focus();
}
