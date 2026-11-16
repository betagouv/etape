import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { wait } from "./wait.js";

describe("wait", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("se résout une fois le délai écoulé, pas avant", async () => {
    const resolved = vi.fn();
    void wait(1_000).then(resolved);

    await vi.advanceTimersByTimeAsync(999);
    expect(resolved).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(resolved).toHaveBeenCalledOnce();
  });
});
