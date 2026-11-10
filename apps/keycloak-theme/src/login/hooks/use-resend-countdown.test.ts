import { act, renderHook } from "@testing-library/react";
import type { FormEvent } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { I18n } from "../i18n";
import { useResendCountdown } from "./use-resend-countdown";

const i18n = { msgStr: (key: string) => key } as unknown as I18n;

const createSubmitEvent = (): FormEvent<HTMLFormElement> & {
  preventDefault: ReturnType<typeof vi.fn>;
} =>
  ({ preventDefault: vi.fn() }) as unknown as FormEvent<HTMLFormElement> & {
    preventDefault: ReturnType<typeof vi.fn>;
  };

const renderCountdown = (initialSeconds: number, isResent = false) =>
  renderHook(() => useResendCountdown({ initialSeconds, isResent, i18n }));

describe("useResendCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("décompte jusqu'à ouvrir le renvoi, puis l'annonce", () => {
    const { result } = renderCountdown(120);

    expect(result.current.isAvailable).toBe(false);
    expect(result.current.remainingLabel).toBe("2:00");
    expect(result.current.announcement).toBe("");

    act(() => vi.advanceTimersByTime(61_000));
    expect(result.current.remainingLabel).toBe("0:59");
    expect(result.current.isAvailable).toBe(false);

    act(() => vi.advanceTimersByTime(59_000));
    expect(result.current.isAvailable).toBe(true);
    expect(result.current.announcement).toBe("etapeResendAvailable");
  });

  it("annonce le renvoi une fois le décompte reparti", () => {
    const { result } = renderCountdown(120, true);

    expect(result.current.announcement).toBe("");

    act(() => vi.advanceTimersByTime(1_000));
    expect(result.current.announcement).toBe("etapeResendDone");
  });

  it("n'annonce rien quand le délai est déjà écoulé à l'ouverture", () => {
    for (const initialSeconds of [0, -5]) {
      const { result } = renderCountdown(initialSeconds, true);

      expect(result.current.isAvailable).toBe(true);
      expect(result.current.announcement).toBe("");

      act(() => vi.advanceTimersByTime(5_000));
      expect(result.current.announcement).toBe("");
    }
  });

  it("reste calé sur l'heure de fin quand l'onglet ralentit les minuteries", () => {
    const { result } = renderCountdown(120);

    act(() => {
      vi.setSystemTime(Date.now() + 100_000);
      vi.advanceTimersByTime(1_000);
    });

    expect(result.current.remainingLabel).toBe("0:19");
  });

  it("ne dépasse jamais le délai de départ quand l'horloge du poste recule", () => {
    const { result } = renderCountdown(120);

    act(() => {
      vi.setSystemTime(Date.now() - 3_600_000);
      vi.advanceTimersByTime(1_000);
    });

    expect(result.current.remainingLabel).toBe("2:00");
    expect(result.current.isAvailable).toBe(false);
  });

  it("refuse l'envoi pendant le délai, puis ne l'accepte qu'une fois", () => {
    const { result } = renderCountdown(2);

    const early = createSubmitEvent();
    act(() => result.current.submit(early));
    expect(early.preventDefault).toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(2_000));

    const first = createSubmitEvent();
    act(() => result.current.submit(first));
    expect(first.preventDefault).not.toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(true);

    const second = createSubmitEvent();
    act(() => result.current.submit(second));
    expect(second.preventDefault).toHaveBeenCalled();
  });

  it("arrête la minuterie au démontage", () => {
    const { unmount } = renderCountdown(120);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
