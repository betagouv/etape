import { useEffect, useState } from "react";

import { AUDIENCE_OPT_OUT_STATUS, type AudienceOptOutStatus } from "./opt-out-status";
import { enqueue } from "./tracker";

/**
 * Au-delà, le script est tenu pour bloqué (bloqueur de publicité) : même délai
 * que le formulaire d'opt-out fourni par Matomo.
 */
const TRACKER_TIMEOUT_MS = 10_000;

/** Les commandes du tracker qui posent ou retirent le refus. */
const OPT_OUT_COMMAND = {
  OPT_OUT: "optUserOut",
  FORGET: "forgetUserOptOut",
} as const;

/** La part de l'API du tracker dont l'opt-out a besoin. */
interface MatomoTracker {
  isUserOptedOut: () => boolean;
}

/**
 * Le choix est lu une fois le tracker chargé : une fonction placée dans la file
 * est appelée avec le tracker en `this`.
 */
function readOptOut(callback: (isOptedOut: boolean) => void): void {
  enqueue([
    function (this: MatomoTracker) {
      callback(this.isUserOptedOut());
    },
  ]);
}

function toStatus(isOptedOut: boolean): AudienceOptOutStatus {
  return isOptedOut ? AUDIENCE_OPT_OUT_STATUS.OPTED_OUT : AUDIENCE_OPT_OUT_STATUS.TRACKED;
}

export interface UseAudienceOptOutResult {
  status: AudienceOptOutStatus;
  /** Sans effet tant que le statut n'est ni `tracked` ni `optedOut`. */
  setOptedOut: (isOptedOut: boolean) => void;
}

/**
 * Le refus de la mesure d'audience, condition de l'exemption de consentement
 * (guide de configuration CNIL, étape 2). Matomo le retient dans un cookie
 * (`mtm_consent_removed`) qui ne contient aucune donnée personnelle.
 */
export function useAudienceOptOut(isEnabled: boolean): UseAudienceOptOutResult {
  const [status, setStatus] = useState<AudienceOptOutStatus>(
    isEnabled ? AUDIENCE_OPT_OUT_STATUS.LOADING : AUDIENCE_OPT_OUT_STATUS.UNAVAILABLE,
  );

  useEffect(() => {
    if (!isEnabled) return;

    let isMounted = true;
    const timeout = window.setTimeout(() => {
      if (isMounted) setStatus(AUDIENCE_OPT_OUT_STATUS.UNAVAILABLE);
    }, TRACKER_TIMEOUT_MS);

    readOptOut((isOptedOut) => {
      window.clearTimeout(timeout);
      if (isMounted) setStatus(toStatus(isOptedOut));
    });

    return () => {
      isMounted = false;
      window.clearTimeout(timeout);
    };
  }, [isEnabled]);

  function setOptedOut(isOptedOut: boolean): void {
    const isReady =
      status === AUDIENCE_OPT_OUT_STATUS.TRACKED || status === AUDIENCE_OPT_OUT_STATUS.OPTED_OUT;
    if (!isReady) return;

    enqueue([isOptedOut ? OPT_OUT_COMMAND.OPT_OUT : OPT_OUT_COMMAND.FORGET]);
    readOptOut((value) => setStatus(toStatus(value)));
  }

  return { status, setOptedOut };
}
