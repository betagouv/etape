import {
  expireSession,
  findSession,
  isSessionEndNear,
  recordSessionActivity,
  resolveSessionEnd,
  SESSION_QUERY_KEY,
  SESSION_WARNING_DELAY_MS,
  type SessionEndCause,
} from "@etape/api-client";
import type { PublicSession } from "@etape/api-contract";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Ce qui compte comme une activité : pointeur, clavier, défilement, retour en
 * arrière. Une navigation dans l'app passe par un clic ou une touche.
 */
const ACTIVITY_EVENTS = [
  "pointermove",
  "pointerdown",
  "keydown",
  "wheel",
  "touchstart",
  "scroll",
  "popstate",
] as const;

/** L'API n'écrit qu'une activité par minute : en signaler davantage ne sert à rien. */
const ACTIVITY_REPORT_INTERVAL_MS = 60 * 1000;

/** La fin qui approche, et de quoi la décrire. */
export interface SessionWarning {
  cause: SessionEndCause;
  maxDurationMs: number;
}

export interface UseSessionActivityResult {
  /** `null` tant que la fin est loin. */
  warning: SessionWarning | null;
  /** « Oui » : prolonge la session et ferme l'avertissement. */
  confirmPresence: () => void;
  isConfirming: boolean;
  /** Vrai une fois la session prolongée par « Oui », pour l'annoncer. */
  isConfirmed: boolean;
}

/**
 * Tient la session ouverte tant que la personne est active, et l'avertit
 * avant qu'elle prenne fin. Le serveur reste seul juge des échéances : le
 * front les relit avant d'avertir, et avant de déclarer la session finie.
 * Plusieurs onglets suivent ainsi la même session sans se parler.
 */
export function useSessionActivity(httpClient: AxiosInstance): UseSessionActivityResult {
  const queryClient = useQueryClient();
  const { data: session, dataUpdatedAt } = useQuery<PublicSession | null>({
    queryKey: SESSION_QUERY_KEY,
    enabled: false,
  });
  const [warningCause, setWarningCause] = useState<SessionEndCause | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const lastReportedAtRef = useRef(Number.NEGATIVE_INFINITY);

  const storeSession = useCallback(
    (fresh: PublicSession) => queryClient.setQueryData(SESSION_QUERY_KEY, fresh),
    [queryClient],
  );

  // Signale l'activité, au plus une fois par minute. Pendant l'avertissement,
  // seul « Oui » prolonge : bouger la souris sans lire ne doit pas le fermer.
  // Sans session (avis de démarrage), il n'y a rien à prolonger.
  const isWarning = warningCause !== null;
  const hasSession = Boolean(session);
  useEffect(() => {
    if (isWarning || !hasSession) return;

    const reportActivity = (): void => {
      const now = Date.now();
      if (now - lastReportedAtRef.current < ACTIVITY_REPORT_INTERVAL_MS) return;

      lastReportedAtRef.current = now;
      // Un 401 passe par `onUnauthorized`. Une panne réseau ne change rien :
      // l'échéance est relue avant d'avertir.
      recordSessionActivity(httpClient).then(storeSession, () => undefined);
    };

    // L'affichage de la page compte comme une activité.
    reportActivity();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, reportActivity, { capture: true, passive: true });
    }
    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, reportActivity, { capture: true });
      }
    };
  }, [hasSession, httpClient, isWarning, storeSession]);

  // Un seul minuteur : l'avertissement, puis la fin. Relu au retour sur
  // l'onglet, que le navigateur ralentit en arrière-plan et suspend en veille.
  useEffect(() => {
    if (!session) return;

    const end = resolveSessionEnd(session.expiry, dataUpdatedAt);
    const dueAt = isWarning ? end.at : end.at - SESSION_WARNING_DELAY_MS;

    // Relit l'échéance sans la repousser (la lecture n'est pas une activité) :
    // un autre onglet a pu la prolonger.
    const checkSession = async (): Promise<void> => {
      const fresh = await findSession(httpClient).catch(() => undefined);
      // L'API ne répond pas : avertir sur la foi de la dernière échéance
      // connue ; à la fin, rester sur l'avertissement, le serveur tranchera
      // à la prochaine requête.
      if (fresh === undefined) {
        if (!isWarning) setWarningCause(end.cause);
        return;
      }
      if (fresh === null) {
        expireSession(queryClient);
        return;
      }

      storeSession(fresh);
      const freshEnd = resolveSessionEnd(fresh.expiry, Date.now());
      setWarningCause(isSessionEndNear(freshEnd, Date.now()) ? freshEnd.cause : null);
    };

    const timer = window.setTimeout(() => void checkSession(), dueAt - Date.now());
    const checkOnReturn = (): void => {
      if (document.visibilityState === "visible" && Date.now() >= dueAt) void checkSession();
    };
    document.addEventListener("visibilitychange", checkOnReturn);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", checkOnReturn);
    };
  }, [dataUpdatedAt, httpClient, isWarning, queryClient, session, storeSession]);

  const confirmPresence = (): void => {
    setIsConfirming(true);
    setIsConfirmed(false);
    recordSessionActivity(httpClient)
      .then((fresh) => {
        lastReportedAtRef.current = Date.now();
        storeSession(fresh);
        setWarningCause(null);
        setIsConfirmed(true);
      })
      // Un 401 ouvre « Session expirée » ; une panne réseau laisse le
      // dialogue ouvert, et « Oui » se relance.
      .catch(() => undefined)
      .finally(() => setIsConfirming(false));
  };

  return {
    // Une session finie l'emporte : son dialogue remplace l'avertissement.
    warning:
      session && warningCause
        ? { cause: warningCause, maxDurationMs: session.expiry.maxDurationMs }
        : null,
    confirmPresence,
    isConfirming,
    isConfirmed,
  };
}
