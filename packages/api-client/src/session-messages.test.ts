import { describe, expect, it } from "vitest";

import {
  describeSessionEnd,
  describeSessionEnding,
  formatDuration,
  PRESENCE_CHECK_NOTICE,
} from "./session-messages";
import { SESSION_END_CAUSE } from "./session-timeline";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

describe("formatDuration", () => {
  it("écrit les heures pleines en heures, le reste en minutes", () => {
    expect(formatDuration(30 * MINUTE_MS)).toBe("30 minutes");
    expect(formatDuration(1 * HOUR_MS)).toBe("1 heure");
    expect(formatDuration(10 * HOUR_MS)).toBe("10 heures");
    expect(formatDuration(90 * MINUTE_MS)).toBe("90 minutes");
  });
});

describe("textes des dialogues de session", () => {
  it("demande si la personne est toujours là, avec le délai restant", () => {
    expect(PRESENCE_CHECK_NOTICE).toEqual({
      title: "Êtes-vous toujours là ?",
      message: "Sans réponse de votre part, votre session expirera dans 2 minutes.",
      actionLabel: "Oui",
    });
  });

  it("prévient de la durée maximale, que seule une reconnexion dépasse", () => {
    expect(describeSessionEnding(10 * HOUR_MS).message).toBe(
      "Elle atteindra dans 2 minutes sa durée maximale de 10 heures. Reconnectez-vous pour en ouvrir une nouvelle.",
    );
  });

  it("reprend les messages du ticket selon la cause de la fin", () => {
    expect(
      describeSessionEnd({ cause: SESSION_END_CAUSE.IDLE, durationMs: 30 * MINUTE_MS }).message,
    ).toBe(
      "Votre session a expiré après 30 minutes d'inactivité. Veuillez vous reconnecter pour continuer.",
    );
    expect(
      describeSessionEnd({ cause: SESSION_END_CAUSE.MAX_DURATION, durationMs: 10 * HOUR_MS })
        .message,
    ).toBe(
      "Votre session a atteint sa durée maximale de 10 heures. Veuillez vous reconnecter pour continuer.",
    );
  });

  it("s'en tient au constat quand la cause n'est pas connue", () => {
    expect(describeSessionEnd(null)).toEqual({
      title: "Votre session a expiré",
      message: "Veuillez vous reconnecter pour continuer.",
      actionLabel: "Se reconnecter",
    });
  });
});
