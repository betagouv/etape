import { FRONT, type Front } from "../front.js";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

/** Quand une session prend fin, selon le front sur lequel elle a été ouverte. */
export interface SessionPolicy {
  /** Sans activité pendant ce délai, la session expire. */
  idleTimeoutMs: number;
  /** Comptée depuis l'ouverture, que l'activité ne repousse jamais. */
  maxDurationMs: number;
}

/**
 * Une règle par front : les bénéficiaires et les instructeurs n'ont pas les
 * mêmes délais. Le realm Keycloak de chaque front reprend les mêmes valeurs
 * (`ssoSessionIdleTimeout`, `ssoSessionMaxLifespan`), dans son fichier pour un
 * realm neuf et dans `deploy/keycloak-init.sh` pour un realm existant.
 */
export const SESSION_POLICY_BY_FRONT: Record<Front, SessionPolicy> = {
  [FRONT.FRONT_OFFICE]: { idleTimeoutMs: 30 * MINUTE_MS, maxDurationMs: 10 * HOUR_MS },
  // Provisoire : les délais des instructeurs ne sont pas encore arbitrés.
  [FRONT.BACK_OFFICE]: { idleTimeoutMs: 1 * HOUR_MS, maxDurationMs: 12 * HOUR_MS },
};

/**
 * Au plus une écriture par minute et par session : chaque requête authentifiée
 * compte comme une activité, et une page qui en lance plusieurs ne doit pas
 * écrire autant de fois en base. La fin d'inactivité retenue peut donc avoir
 * jusqu'à une minute d'avance, jamais de retard.
 */
const ACTIVITY_WRITE_INTERVAL_MS = MINUTE_MS;

/**
 * `true` quand la dernière activité enregistrée date d'au moins une minute :
 * la fin d'inactivité est alors repoussée.
 */
export function isActivityWriteDue(
  idleExpiresAt: number,
  policy: SessionPolicy,
  now: number,
): boolean {
  const lastActivityAt = idleExpiresAt - policy.idleTimeoutMs;
  return now - lastActivityAt >= ACTIVITY_WRITE_INTERVAL_MS;
}
