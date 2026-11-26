// @vitest-environment jsdom
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useFocusAfterRender } from "./use-focus-after-render";

afterEach(cleanup);

describe("useFocusAfterRender", () => {
  it("place le focus demandé après le rendu suivant, pas avant", () => {
    const { result, rerender } = renderHook(() => useFocusAfterRender());
    const focus = vi.fn();

    result.current(focus);
    expect(focus).not.toHaveBeenCalled();

    rerender();
    expect(focus).toHaveBeenCalledOnce();
  });

  it("ne le replace pas aux rendus d'après", () => {
    const { result, rerender } = renderHook(() => useFocusAfterRender());
    const focus = vi.fn();
    result.current(focus);

    rerender();
    rerender();

    expect(focus).toHaveBeenCalledOnce();
  });

  it("ne garde que le dernier focus demandé avant le rendu", () => {
    const { result, rerender } = renderHook(() => useFocusAfterRender());
    const first = vi.fn();
    const last = vi.fn();
    result.current(first);
    result.current(last);

    rerender();

    expect(first).not.toHaveBeenCalled();
    expect(last).toHaveBeenCalledOnce();
  });
});
