import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useSubmitting } from "./use-submitting";

const showPage = (persisted: boolean): void => {
  const event = new Event("pageshow") as PageTransitionEvent;
  Object.defineProperty(event, "persisted", { value: persisted });
  window.dispatchEvent(event);
};

describe("useSubmitting", () => {
  it("libère l'envoi quand la page revient du cache du navigateur", () => {
    const { result } = renderHook(() => useSubmitting());

    act(() => result.current.startSubmitting());
    expect(result.current.isSubmitting).toBe(true);

    act(() => showPage(true));
    expect(result.current.isSubmitting).toBe(false);
  });

  it("garde l'envoi en cours au premier affichage de la page", () => {
    const { result } = renderHook(() => useSubmitting());

    act(() => result.current.startSubmitting());
    act(() => showPage(false));

    expect(result.current.isSubmitting).toBe(true);
  });
});
