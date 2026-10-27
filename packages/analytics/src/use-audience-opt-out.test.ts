import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AUDIENCE_OPT_OUT_STATUS } from "./opt-out-status";
import { useAudienceOptOut } from "./use-audience-opt-out";

afterEach(() => {
  delete window._paq;
  vi.useRealTimers();
});

/**
 * Ce que fait `matomo.js` une fois chargé : il remplace la file par un objet dont
 * `push` exécute aussitôt la commande, une fonction étant appelée avec le tracker.
 */
function loadFakeTracker(isOptedOut: boolean): void {
  let optedOut = isOptedOut;
  const tracker = { isUserOptedOut: () => optedOut };
  const run = (command: unknown[]): void => {
    const [method] = command;
    if (typeof method === "function") method.call(tracker);
    if (method === "optUserOut") optedOut = true;
    if (method === "forgetUserOptOut") optedOut = false;
  };
  const pending = window._paq instanceof Array ? (window._paq as unknown[][]) : [];
  window._paq = { push: (...commands: unknown[][]) => commands.forEach(run) };
  pending.forEach(run);
}

describe("useAudienceOptOut", () => {
  it("se dit indisponible quand la mesure est désactivée, sans rien charger", () => {
    const { result } = renderHook(() => useAudienceOptOut(false));

    expect(result.current.status).toBe(AUDIENCE_OPT_OUT_STATUS.UNAVAILABLE);
    expect(window._paq).toBeUndefined();
  });

  it("attend le tracker, puis lit le choix qu'il a enregistré", () => {
    const { result } = renderHook(() => useAudienceOptOut(true));
    expect(result.current.status).toBe(AUDIENCE_OPT_OUT_STATUS.LOADING);

    act(() => loadFakeTracker(true));

    expect(result.current.status).toBe(AUDIENCE_OPT_OUT_STATUS.OPTED_OUT);
  });

  it("pose puis retire le refus", () => {
    loadFakeTracker(false);
    const { result } = renderHook(() => useAudienceOptOut(true));
    expect(result.current.status).toBe(AUDIENCE_OPT_OUT_STATUS.TRACKED);

    act(() => result.current.setOptedOut(true));
    expect(result.current.status).toBe(AUDIENCE_OPT_OUT_STATUS.OPTED_OUT);

    act(() => result.current.setOptedOut(false));
    expect(result.current.status).toBe(AUDIENCE_OPT_OUT_STATUS.TRACKED);
  });

  it("se dit indisponible quand le script n'arrive pas (bloqueur)", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useAudienceOptOut(true));

    act(() => vi.advanceTimersByTime(10_000));

    expect(result.current.status).toBe(AUDIENCE_OPT_OUT_STATUS.UNAVAILABLE);
  });

  it("ignore une bascule tant que le choix n'est pas connu", () => {
    const { result } = renderHook(() => useAudienceOptOut(true));

    act(() => result.current.setOptedOut(true));

    expect(window._paq).toHaveLength(1);
    expect(result.current.status).toBe(AUDIENCE_OPT_OUT_STATUS.LOADING);
  });
});
