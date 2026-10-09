import type { PublicSession } from "@etape/api-contract";

const MINUTE_MS = 60 * 1000;

/** Une session du front-office, ouverte à l'instant. */
export const SESSION_FIXTURE: PublicSession = {
  sub: "sub",
  email: "camille.martin@exemple.fr",
  isFranceConnectSession: false,
  claims: { given_name: "Camille" },
  expiry: {
    idleTimeoutMs: 30 * MINUTE_MS,
    maxDurationMs: 600 * MINUTE_MS,
    idleRemainingMs: 30 * MINUTE_MS,
    maxRemainingMs: 600 * MINUTE_MS,
  },
};
