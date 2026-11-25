// @vitest-environment jsdom
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useButtonRegistry } from "./use-button-registry";

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

function appendButton(): HTMLButtonElement {
  const button = document.createElement("button");
  document.body.append(button);
  return button;
}

describe("useButtonRegistry", () => {
  it("rend le focus au bouton enregistré pour un élément", () => {
    const { result } = renderHook(() => useButtonRegistry());
    const first = appendButton();
    const second = appendButton();
    result.current.register("a")(first);
    result.current.register("b")(second);

    expect(result.current.focus("b")).toBe(true);
    expect(document.activeElement).toBe(second);
  });

  it("ne fait rien pour un bouton retiré ou jamais enregistré", () => {
    const { result } = renderHook(() => useButtonRegistry());
    const button = appendButton();
    result.current.register("a")(button);
    result.current.register("a")(null);

    expect(result.current.focus("a")).toBe(false);
    expect(result.current.focus("inconnu")).toBe(false);
    expect(document.activeElement).toBe(document.body);
  });

  it("garde les boutons d'un rendu à l'autre", () => {
    const { result, rerender } = renderHook(() => useButtonRegistry());
    const button = appendButton();
    result.current.register("a")(button);
    rerender();

    expect(result.current.focus("a")).toBe(true);
    expect(document.activeElement).toBe(button);
  });
});
