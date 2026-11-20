// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TYPE_DEMARCHE, type Demarche } from "../domain/demarche";
import { useDemarcheRemoval, type DemarcheRemovalActions } from "./use-demarche-removal";

afterEach(cleanup);

function createDemarche(id: string): Demarche {
  return {
    id,
    typeDemarche: TYPE_DEMARCHE.SALON,
    precisionTypeDemarche: "",
    apportDemarche: "J’ai rencontré trois artisans.",
    piecesJustificatives: [],
  };
}

const SALON = createDemarche("a");
const FORUM = createDemarche("b");

function renderRemoval(demarches: readonly Demarche[] = [SALON, FORUM]) {
  const focusAfterRemoval = vi.fn();
  const actions = {
    removeDemarche: vi.fn<DemarcheRemovalActions["removeDemarche"]>(() => focusAfterRemoval),
    removeAllDemarches: vi.fn<DemarcheRemovalActions["removeAllDemarches"]>(
      () => focusAfterRemoval,
    ),
    focusAnswer: vi.fn<DemarcheRemovalActions["focusAnswer"]>(),
  };
  const { result } = renderHook(() => useDemarcheRemoval(demarches, actions));
  return { result, actions, focusAfterRemoval };
}

describe("useDemarcheRemoval", () => {
  it("montre la démarche de la corbeille cliquée, avec son rang", () => {
    const { result } = renderRemoval();

    act(() => result.current.requestRemoval(FORUM));

    expect(result.current.isRemovalOpen).toBe(true);
    expect(result.current.removal).toEqual({
      items: [{ demarche: FORUM, index: 1 }],
      isAnswerNon: false,
    });
  });

  it("rend le focus à la corbeille quand la suppression est abandonnée", () => {
    const { result, actions } = renderRemoval();
    const button = document.createElement("button");
    document.body.append(button);
    result.current.registerRemoveButton(SALON.id)(button);
    act(() => result.current.requestRemoval(SALON));

    act(() => result.current.cancelRemoval());
    act(() => result.current.restoreFocusAfterRemoval());

    expect(result.current.isRemovalOpen).toBe(false);
    expect(actions.removeDemarche).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(button);
    button.remove();
  });

  it("supprime la démarche confirmée, puis place le focus que la suppression a prévu, une seule fois", () => {
    const { result, actions, focusAfterRemoval } = renderRemoval();
    act(() => result.current.requestRemoval(FORUM));

    act(() => result.current.confirmRemoval());
    expect(actions.removeDemarche).toHaveBeenCalledExactlyOnceWith({ demarche: FORUM, index: 1 });
    expect(focusAfterRemoval).not.toHaveBeenCalled();

    act(() => result.current.restoreFocusAfterRemoval());
    act(() => result.current.restoreFocusAfterRemoval());
    expect(focusAfterRemoval).toHaveBeenCalledOnce();
  });

  it("montre toutes les démarches pour un « non », et rend le focus à la question s'il est abandonné", () => {
    const { result, actions } = renderRemoval();

    act(() => result.current.requestAllRemoval());
    expect(result.current.removal?.isAnswerNon).toBe(true);
    expect(result.current.removal?.items.map(({ index }) => index)).toEqual([0, 1]);

    act(() => result.current.cancelRemoval());
    act(() => result.current.restoreFocusAfterRemoval());
    expect(actions.focusAnswer).toHaveBeenCalledOnce();
    expect(actions.removeAllDemarches).not.toHaveBeenCalled();
  });

  it("supprime toutes les démarches quand le « non » est confirmé", () => {
    const { result, actions } = renderRemoval();
    act(() => result.current.requestAllRemoval());

    act(() => result.current.confirmRemoval());

    expect(actions.removeAllDemarches).toHaveBeenCalledExactlyOnceWith(2);
    expect(result.current.isRemovalOpen).toBe(false);
  });

  it("ignore une démarche absente de la liste, et une confirmation sans suppression en attente", () => {
    const { result, actions } = renderRemoval([SALON]);

    act(() => result.current.requestRemoval(FORUM));
    act(() => result.current.confirmRemoval());

    expect(result.current.isRemovalOpen).toBe(false);
    expect(actions.removeDemarche).not.toHaveBeenCalled();
  });
});
