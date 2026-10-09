import {
  expireSession,
  findSession,
  isSessionEndNear,
  isStaleExpiry,
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

/**
 * Le temps de laisser le lecteur d'écran annoncer « Votre session est
 * prolongée. », après quoi la région redevient vide (`accessibilite.md`, § 2).
 */
const CONFIRMATION_ANNOUNCEMENT_MS = 10 * 1000;

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
  /** « Oui » n'a pas abouti (l'API ne répond pas) : le dialogue reste ouvert. */
  hasConfirmFailed: boolean;
  /** Vrai un instant après la prolongation par « Oui », pour l'annoncer. */
  isConfirmed: boolean;
}

/**
 * Tient la session ouverte tant que la personne est active, et l'avertit
 * avant qu'elle prenne fin. Le serveur reste seul juge des échéances : le
 * front les relit avant d'avertir, et avant de déclarer la session finie.
 * Plusieurs onglets suivent ainsi la même session sans se parler.
 *
 * `isEnabled` à `false` suspend tout : derrière un avis de démarrage (une
 * déconnexion refusée, par exemple), bouger la souris ne doit pas prolonger
 * une session que la personne voulait fermer.
 */
export function useSessionActivity(
  httpClient: AxiosInstance,
  isEnabled: boolean,
): UseSessionActivityResult {
  const queryClient = useQueryClient();
  const { data: session, dataUpdatedAt } = useQuery<PublicSession | null>({
    queryKey: SESSION_QUERY_KEY,
    enabled: false,
  });
  const [warningCause, setWarningCause] = useState<SessionEndCause | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasConfirmFailed, setHasConfirmFailed] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const lastReportedAtRef = useRef(Number.NEGATIVE_INFINITY);

  // Toute session reçue passe ici, prolongation comme relecture : on écarte
  // une réponse dépassée par une autre déjà reçue (les deux peuvent revenir
  // dans le désordre), puis l'avertissement suit la session gardée — ouvert si
  // la fin est proche, fermé sinon, y compris quand un autre onglet l'a
  // repoussée. Une session déjà expirée ne renaît pas d'une réponse tardive.
  const applySession = useCallback(
    (fresh: PublicSession) => {
      const receivedAt = Date.now();
      const known = queryClient.getQueryState<PublicSession | null>(SESSION_QUERY_KEY);
      if (!known?.data) return;
      if (isStaleExpiry(fresh.expiry, receivedAt, known.data.expiry, known.dataUpdatedAt)) return;

      queryClient.setQueryData(SESSION_QUERY_KEY, fresh);
      const end = resolveSessionEnd(fresh.expiry, receivedAt);
      setWarningCause(isSessionEndNear(end, receivedAt) ? end.cause : null);
    },
    [queryClient],
  );

  // Signale l'activité, au plus une fois par minute. Pendant l'avertissement,
  // seul « Oui » prolonge : bouger la souris sans lire ne doit pas le fermer.
  const isWarning = warningCause !== null;
  const hasSession = Boolean(session);
  useEffect(() => {
    if (!isEnabled || isWarning || !hasSession) return;

    const reportActivity = (): void => {
      const now = Date.now();
      if (now - lastReportedAtRef.current < ACTIVITY_REPORT_INTERVAL_MS) return;

      lastReportedAtRef.current = now;
      // Un 401 passe par `onUnauthorized`. Une panne réseau ne change rien :
      // l'échéance est relue avant d'avertir.
      recordSessionActivity(httpClient).then(applySession, () => undefined);
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
  }, [applySession, hasSession, httpClient, isEnabled, isWarning]);

  // Un seul minuteur : l'avertissement, puis la fin. Relu au retour sur
  // l'onglet, que le navigateur ralentit en arrière-plan et suspend en veille.
  useEffect(() => {
    if (!isEnabled || !session) return;

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

      applySession(fresh);
    };

    const timer = window.setTimeout(() => void checkSession(), dueAt - Date.now());
    // Pendant l'avertissement, toujours : un autre onglet a pu prolonger la
    // session entre-temps, et la question n'a plus lieu d'être.
    const checkOnReturn = (): void => {
      if (document.visibilityState !== "visible") return;
      if (isWarning || Date.now() >= dueAt) void checkSession();
    };
    document.addEventListener("visibilitychange", checkOnReturn);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", checkOnReturn);
    };
  }, [applySession, dataUpdatedAt, httpClient, isEnabled, isWarning, queryClient, session]);

  const confirmPresence = (): void => {
    setIsConfirming(true);
    setHasConfirmFailed(false);
    setIsConfirmed(false);
    recordSessionActivity(httpClient)
      .then((fresh) => {
        lastReportedAtRef.current = Date.now();
        applySession(fresh);
        setIsConfirmed(true);
        window.setTimeout(() => setIsConfirmed(false), CONFIRMATION_ANNOUNCEMENT_MS);
      })
      // Un 401 ouvre « Session expirée » à la place ; une panne réseau laisse
      // le dialogue ouvert, avec son message, et « Oui » se relance.
      .catch(() => setHasConfirmFailed(true))
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
    hasConfirmFailed,
    isConfirmed,
  };
}
