import { describe, expect, it } from "vitest";

import {
  createLoginAttempts,
  LOGIN_ATTEMPTS_WINDOW_MS,
  MAX_LOGIN_ATTEMPTS,
} from "./login-attempts";
import { MemoryStorage } from "./testing/memory-storage";

function createClock(start = 1_000_000): { now: () => number; advance: (ms: number) => void } {
  let current = start;
  return { now: () => current, advance: (ms) => (current += ms) };
}

describe("createLoginAttempts", () => {
  it("laisse partir vers la connexion jusqu'au maximum, puis renonce", () => {
    const storage = new MemoryStorage();
    const attempts = createLoginAttempts(() => storage, createClock().now);

    for (let attempt = 0; attempt < MAX_LOGIN_ATTEMPTS; attempt++) {
      expect(attempts.isLoginLoopSuspected()).toBe(false);
      attempts.recordLoginAttempt();
    }

    expect(attempts.isLoginLoopSuspected()).toBe(true);
  });

  it("oublie les tentatives sorties de la fenêtre", () => {
    const storage = new MemoryStorage();
    const clock = createClock();
    const attempts = createLoginAttempts(() => storage, clock.now);

    attempts.recordLoginAttempt();
    attempts.recordLoginAttempt();
    clock.advance(LOGIN_ATTEMPTS_WINDOW_MS + 1);

    expect(attempts.isLoginLoopSuspected()).toBe(false);
  });

  it("repart de zéro une fois la connexion réussie", () => {
    const storage = new MemoryStorage();
    const attempts = createLoginAttempts(() => storage, createClock().now);

    attempts.recordLoginAttempt();
    attempts.recordLoginAttempt();
    attempts.clearLoginAttempts();

    expect(attempts.isLoginLoopSuspected()).toBe(false);
  });

  it("soupçonne une boucle quand le stockage est inaccessible", () => {
    // Le cas des cookies bloqués : lire `window.sessionStorage` lève une exception.
    const attempts = createLoginAttempts(() => {
      throw new DOMException("Access is denied for this document.", "SecurityError");
    });

    expect(attempts.isLoginLoopSuspected()).toBe(true);
    expect(() => attempts.recordLoginAttempt()).not.toThrow();
    expect(() => attempts.clearLoginAttempts()).not.toThrow();
  });

  it("ignore un contenu illisible", () => {
    const storage = new MemoryStorage();
    storage.setItem("etape.login-attempts", "pas du JSON");
    const attempts = createLoginAttempts(() => storage);

    // Illisible n'est pas inaccessible : pas de boucle soupçonnée, et le
    // compteur repart.
    expect(attempts.isLoginLoopSuspected()).toBe(false);
    attempts.recordLoginAttempt();
    expect(attempts.isLoginLoopSuspected()).toBe(false);
    attempts.recordLoginAttempt();
    expect(attempts.isLoginLoopSuspected()).toBe(true);
  });
});
