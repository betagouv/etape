import type { UseFormProps } from "react-hook-form";

/** Les options de `useForm` communes à tous les volets. */
export const VOLET_FORM_OPTIONS = {
  // L'annonce d'erreur de `useFieldErrorAnnouncement` se déclenche à la sortie d'un champ.
  mode: "onBlur",
  reValidateMode: "onBlur",
  // Le focus revient au résumé d'erreurs de l'écran, pas au premier champ fautif.
  shouldFocusError: false,
} as const satisfies Pick<UseFormProps, "mode" | "reValidateMode" | "shouldFocusError">;
