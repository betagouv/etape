// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import type { ChangeEvent } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Adresse } from "../components/adresse/adresse";
import { findAdresses } from "../components/adresse/adresse-api";
import { ADRESSE_SEARCH_STATUS, useAdresseSearch } from "./use-adresse-search";

vi.mock("../components/adresse/adresse-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../components/adresse/adresse-api")>()),
  findAdresses: vi.fn(),
}));

const DEBOUNCE_MS = 250;
const ADRESSE: Adresse = {
  voie: "12 rue de la Paix",
  complement: "",
  codePostal: "75002",
  commune: "Paris",
  codeCommune: "75102",
};

const search = vi.mocked(findAdresses);

const typed = (value: string): ChangeEvent<HTMLInputElement> =>
  ({ target: { value } }) as ChangeEvent<HTMLInputElement>;

const passDebounce = (): Promise<void> =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
  });

describe("useAdresseSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    search.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("ne cherche qu'une fois le délai de frappe passé", async () => {
    search.mockResolvedValue([ADRESSE]);
    const { result } = renderHook(() => useAdresseSearch(null));

    act(() => result.current.changeText(typed("12 rue")));
    expect(result.current.status).toBe(ADRESSE_SEARCH_STATUS.SEARCHING);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS - 1);
    });
    expect(search).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(search).toHaveBeenCalledOnce();
    expect(result.current.status).toBe(ADRESSE_SEARCH_STATUS.FOUND);
  });

  it("annule la requête en cours quand le texte change", async () => {
    search.mockReturnValue(new Promise(() => undefined));
    const { result } = renderHook(() => useAdresseSearch(null));

    act(() => result.current.changeText(typed("12 rue")));
    await passDebounce();
    const signal = search.mock.calls[0]?.[1];
    expect(signal?.aborted).toBe(false);

    act(() => result.current.changeText(typed("12 rue de")));
    expect(signal?.aborted).toBe(true);
  });

  it("passe en indisponible sur un échec, pas sur une annulation", async () => {
    let rejectFirst: (reason: Error) => void = () => undefined;
    search.mockReturnValueOnce(
      new Promise((_, reject) => {
        rejectFirst = reject;
      }),
    );
    search.mockRejectedValueOnce(new Error("Réponse 500"));
    const { result } = renderHook(() => useAdresseSearch(null));

    act(() => result.current.changeText(typed("12 rue")));
    await passDebounce();
    act(() => result.current.changeText(typed("12 rue de")));
    await act(async () => {
      rejectFirst(new Error("annulée"));
      await Promise.resolve();
    });
    expect(result.current.status).toBe(ADRESSE_SEARCH_STATUS.SEARCHING);

    await passDebounce();
    expect(result.current.status).toBe(ADRESSE_SEARCH_STATUS.UNAVAILABLE);
  });

  it("relance la recherche après un échec", async () => {
    search.mockRejectedValueOnce(new Error("Réponse 500"));
    search.mockResolvedValueOnce([ADRESSE]);
    const { result } = renderHook(() => useAdresseSearch(null));

    act(() => result.current.changeText(typed("12 rue")));
    await passDebounce();
    expect(result.current.status).toBe(ADRESSE_SEARCH_STATUS.UNAVAILABLE);

    act(() => result.current.retry());
    expect(result.current.status).toBe(ADRESSE_SEARCH_STATUS.SEARCHING);
    await passDebounce();
    expect(result.current.status).toBe(ADRESSE_SEARCH_STATUS.FOUND);
    expect(search).toHaveBeenCalledTimes(2);
  });

  it("garde le résultat quand seule une espace finale change", async () => {
    search.mockResolvedValue([]);
    const { result } = renderHook(() => useAdresseSearch(null));

    act(() => result.current.changeText(typed("12 rue")));
    await passDebounce();
    expect(result.current.status).toBe(ADRESSE_SEARCH_STATUS.EMPTY);

    act(() => result.current.changeText(typed("12 rue ")));
    await passDebounce();
    expect(result.current.status).toBe(ADRESSE_SEARCH_STATUS.EMPTY);
    expect(search).toHaveBeenCalledOnce();
  });

  it("n'ouvre la liste que si le champ a encore le focus", async () => {
    search.mockResolvedValue([ADRESSE]);
    const { result } = renderHook(() => useAdresseSearch(null));

    act(() => result.current.handleFocus());
    act(() => result.current.changeText(typed("12 rue")));
    await passDebounce();
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.handleBlur());
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.handleFocus());
    act(() => result.current.changeText(typed("12 rue de")));
    act(() => result.current.handleBlur());
    await passDebounce();
    expect(result.current.status).toBe(ADRESSE_SEARCH_STATUS.FOUND);
    expect(result.current.isOpen).toBe(false);
  });
});
