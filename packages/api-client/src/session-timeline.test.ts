import { describe, expect, it } from "vitest";

import { resolveSessionEnd, resolveSessionEndNotice, SESSION_END_CAUSE } from "./session-timeline";

const MINUTE_MS = 60 * 1000;
const RECEIVED_AT = 1_000_000;

const expiry = {
  idleTimeoutMs: 30 * MINUTE_MS,
  maxDurationMs: 600 * MINUTE_MS,
  idleRemainingMs: 30 * MINUTE_MS,
  maxRemainingMs: 600 * MINUTE_MS,
};

describe("resolveSessionEnd", () => {
  it("retient la fin d'inactivité quand elle vient avant la durée maximale", () => {
    expect(resolveSessionEnd(expiry, RECEIVED_AT)).toEqual({
      at: RECEIVED_AT + 30 * MINUTE_MS,
      cause: SESSION_END_CAUSE.IDLE,
    });
  });

  it("retient la durée maximale quand elle arrive la première", () => {
    expect(resolveSessionEnd({ ...expiry, maxRemainingMs: 10 * MINUTE_MS }, RECEIVED_AT)).toEqual({
      at: RECEIVED_AT + 10 * MINUTE_MS,
      cause: SESSION_END_CAUSE.MAX_DURATION,
    });
  });

  it("donne la durée maximale à égalité : « Oui » ne la repousserait pas", () => {
    const end = resolveSessionEnd(
      { ...expiry, maxRemainingMs: expiry.idleRemainingMs },
      RECEIVED_AT,
    );

    expect(end.cause).toBe(SESSION_END_CAUSE.MAX_DURATION);
  });

  it("compte depuis l'heure de réception, pas depuis l'horloge du serveur", () => {
    expect(resolveSessionEnd(expiry, 0).at).toBe(30 * MINUTE_MS);
  });
});

describe("resolveSessionEndNotice", () => {
  const idleEnd = RECEIVED_AT + 30 * MINUTE_MS;

  it("attribue une fin à l'inactivité, avec le délai du front", () => {
    expect(resolveSessionEndNotice(expiry, RECEIVED_AT, idleEnd)).toEqual({
      cause: SESSION_END_CAUSE.IDLE,
      durationMs: 30 * MINUTE_MS,
    });
  });

  it("attribue une fin à la durée maximale, avec la durée du front", () => {
    const shortExpiry = { ...expiry, maxRemainingMs: 10 * MINUTE_MS };

    expect(resolveSessionEndNotice(shortExpiry, RECEIVED_AT, RECEIVED_AT + 10 * MINUTE_MS)).toEqual(
      { cause: SESSION_END_CAUSE.MAX_DURATION, durationMs: 600 * MINUTE_MS },
    );
  });

  it("tolère que le 401 arrive juste avant la fin vue du front", () => {
    expect(resolveSessionEndNotice(expiry, RECEIVED_AT, idleEnd - 2_000)?.cause).toBe(
      SESSION_END_CAUSE.IDLE,
    );
  });

  it("ne donne aucune cause à une fin anticipée, comme une déconnexion ailleurs", () => {
    expect(resolveSessionEndNotice(expiry, RECEIVED_AT, idleEnd - MINUTE_MS)).toBeNull();
  });
});
