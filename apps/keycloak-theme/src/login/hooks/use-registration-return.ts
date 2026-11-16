import { useEffect, useState } from "react";

import {
  forgetRegistrationReturn,
  readRegistrationReturn,
  shouldReturnToRegistration,
} from "../components/registration-return";

/**
 * Renvoie à l'inscription quand Keycloak affiche la connexion à sa place : après « Revenir
 * sur Transitions Pro » ou « Annuler et revenir à l'inscription ». Vrai pendant la redirection,
 * pour que la page n'affiche rien.
 *
 * La raison est oubliée à chaque passage sur la connexion : elle ne sert qu'une fois.
 */
export function useRegistrationReturn(registrationUrl: string | undefined): boolean {
  const [isReturning] = useState(
    () =>
      registrationUrl !== undefined &&
      shouldReturnToRegistration(readRegistrationReturn(), window.location),
  );

  useEffect(() => {
    forgetRegistrationReturn();
    if (isReturning && registrationUrl !== undefined) window.location.replace(registrationUrl);
  }, [isReturning, registrationUrl]);

  return isReturning;
}
