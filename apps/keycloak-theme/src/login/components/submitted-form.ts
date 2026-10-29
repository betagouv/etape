export const SUBMITTED_FORM = {
  LOGIN: "login",
  REGISTRATION: "registration",
} as const;

export type SubmittedForm = (typeof SUBMITTED_FORM)[keyof typeof SUBMITTED_FORM];

const STORAGE_KEY = "etape-submitted-form";

const isSubmittedForm = (value: string | null): value is SubmittedForm =>
  Object.values<string | null>(SUBMITTED_FORM).includes(value);

export function rememberSubmittedForm(form: SubmittedForm): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, form);
  } catch {
    return;
  }
}

export function forgetSubmittedForm(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
}

export function readSubmittedForm(): SubmittedForm | undefined {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    return isSubmittedForm(value) ? value : undefined;
  } catch {
    return undefined;
  }
}
