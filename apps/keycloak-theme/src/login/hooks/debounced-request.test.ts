import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDebouncedRequest } from "./debounced-request";

const DELAY_MS = 250;

describe("createDebouncedRequest", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ne lance que la dernière requête, après le délai", () => {
    const request = createDebouncedRequest();
    const first = vi.fn();
    const second = vi.fn();

    request.run(first, DELAY_MS);
    request.run(second, DELAY_MS);
    vi.advanceTimersByTime(DELAY_MS - 1);
    expect(second).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it("annule la requête en cours quand une autre part", () => {
    const request = createDebouncedRequest();
    let firstSignal: AbortSignal | undefined;

    request.run((signal) => {
      firstSignal = signal;
    }, 0);
    vi.advanceTimersByTime(0);
    request.run(vi.fn(), 0);

    expect(firstSignal?.aborted).toBe(true);
  });

  it("n'appelle plus rien après cancel", () => {
    const request = createDebouncedRequest();
    const pending = vi.fn();

    request.run(pending, DELAY_MS);
    request.cancel();
    vi.advanceTimersByTime(DELAY_MS);

    expect(pending).not.toHaveBeenCalled();
  });
});
