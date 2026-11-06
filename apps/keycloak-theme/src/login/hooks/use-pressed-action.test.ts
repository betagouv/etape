// @vitest-environment jsdom
import { cleanup, fireEvent, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { usePressedAction } from "./use-pressed-action";

const add = (tag: string): HTMLElement => {
  const element = document.createElement(tag);
  document.body.append(element);
  return element;
};

describe("usePressedAction", () => {
  afterEach(() => {
    cleanup();
    document.body.replaceChildren();
  });

  it.each(["a", "button", "label"])("repère l'appui sur %s jusqu'au relâchement", (tag) => {
    const { result } = renderHook(() => usePressedAction());

    fireEvent.mouseDown(add(tag));
    expect(result.current.current).toBe(true);

    fireEvent.mouseUp(document.body);
    expect(result.current.current).toBe(false);
  });

  it("repère un appui sur l'icône d'un bouton", () => {
    const { result } = renderHook(() => usePressedAction());
    const icon = document.createElement("span");
    add("button").append(icon);

    fireEvent.mouseDown(icon);
    expect(result.current.current).toBe(true);
  });

  it("ignore un appui sur un champ de saisie", () => {
    const { result } = renderHook(() => usePressedAction());

    fireEvent.mouseDown(add("input"));
    expect(result.current.current).toBe(false);
  });
});
