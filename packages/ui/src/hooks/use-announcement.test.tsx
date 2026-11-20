import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useAnnouncement } from "@etape/ui/hooks/use-announcement";

afterEach(cleanup);

const REMOVED = "Démarche 1 supprimée.";

describe("useAnnouncement", () => {
  it("part d'une région au repos, puis porte le texte annoncé", () => {
    const { result } = renderHook(() => useAnnouncement());
    expect(result.current.message).toBe("");

    act(() => result.current.announce(REMOVED));

    expect(result.current.message).toBe(REMOVED);
  });

  it("change le texte d'un message redit à l'identique, pour qu'il soit redit", () => {
    const { result } = renderHook(() => useAnnouncement());
    act(() => result.current.announce(REMOVED));

    act(() => result.current.announce(REMOVED));
    const second = result.current.message;
    act(() => result.current.announce(REMOVED));
    const third = result.current.message;

    expect(second).not.toBe(REMOVED);
    expect(second.trim()).toBe(REMOVED);
    expect(third).not.toBe(second);
    expect(third.trim()).toBe(REMOVED);
  });

  it("laisse tel quel un message différent du précédent", () => {
    const { result } = renderHook(() => useAnnouncement());
    act(() => result.current.announce(REMOVED));

    act(() => result.current.announce("Démarche 2 supprimée."));

    expect(result.current.message).toBe("Démarche 2 supprimée.");
  });

  it("revient au repos sur une chaîne vide, même répétée", () => {
    const { result } = renderHook(() => useAnnouncement());
    act(() => result.current.announce(REMOVED));

    act(() => result.current.announce(""));
    act(() => result.current.announce(""));

    expect(result.current.message).toBe("");
  });
});
