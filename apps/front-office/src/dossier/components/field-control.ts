import type { Ref } from "react";

/**
 * Ce que fournit le `field` d'un `Controller` de react-hook-form à un champ dont la valeur est
 * un texte. `ControllerRenderProps` lierait la vue aux types du formulaire et type `value` en `any`.
 */
export interface FieldControl<TElement extends HTMLElement> {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  ref: Ref<TElement>;
}
