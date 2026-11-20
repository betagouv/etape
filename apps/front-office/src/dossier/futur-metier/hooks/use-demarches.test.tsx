// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { OUI_NON } from "../../domain/oui-non";
import { NOMBRE_MAX_DEMARCHES, TYPE_DEMARCHE, type Demarche } from "../domain/demarche";
import type { FuturMetierFormData } from "../schema";
import { useDemarches, type UseDemarchesResult } from "./use-demarches";
import { useFuturMetierForm, type UseFuturMetierFormResult } from "./use-futur-metier-form";

afterEach(cleanup);

type Result = UseFuturMetierFormResult & UseDemarchesResult;

/** Le formulaire du volet et ses démarches, « oui » répondu et saisie en cours remplie de `values`. */
function renderDemarches(values: Partial<FuturMetierFormData> = {}): { current: Result } {
  const { result } = renderHook(() => {
    const volet = useFuturMetierForm();
    return { ...volet, ...useDemarches(volet.form) };
  });
  act(() => {
    const { form } = result.current;
    form.reset({ ...form.getValues(), demarcheDecouverte: OUI_NON.OUI, ...values });
  });
  return result;
}

const IMMERSION: Partial<FuturMetierFormData> = {
  typeDemarche: TYPE_DEMARCHE.IMMERSION,
  apportDemarche: "J’ai vérifié que je tenais ce rythme.",
};

function createDemarches(count: number): Demarche[] {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index),
    typeDemarche: TYPE_DEMARCHE.SALON,
    precisionTypeDemarche: "",
    apportDemarche: "J’ai rencontré trois artisans.",
    piecesJustificatives: [],
  }));
}

describe("useDemarches", () => {
  it("part d'une carte de saisie ouverte, bouton de validation grisé", () => {
    const result = renderDemarches();

    expect(result.current.demarches).toEqual([]);
    expect(result.current.hasCurrentDemarche).toBe(true);
    expect(result.current.isCurrentDemarcheFilled).toBe(false);
  });

  it("montre ce qui manque quand on valide une saisie incomplète, sans rien ajouter", async () => {
    const result = renderDemarches({ typeDemarche: TYPE_DEMARCHE.AUTRE });

    await act(() => result.current.validateDemarche());

    const { errors } = result.current.form.formState;
    expect(errors.precisionTypeDemarche?.message).toBe("Veuillez préciser le type de démarche.");
    expect(errors.apportDemarche?.message).toBe(
      "Veuillez indiquer ce que la démarche vous a apporté.",
    );
    // Les autres champs du volet, vides eux aussi, ne sont pas signalés par ce bouton.
    expect(errors.quotidienMetier).toBeUndefined();
    expect(result.current.demarches).toEqual([]);
    expect(result.current.hasCurrentDemarche).toBe(true);
  });

  it("valide la saisie : la démarche rejoint la liste, la carte se referme et la saisie se vide", async () => {
    const result = renderDemarches(IMMERSION);
    expect(result.current.isCurrentDemarcheFilled).toBe(true);

    await act(() => result.current.validateDemarche());

    expect(result.current.demarches).toHaveLength(1);
    expect(result.current.demarches[0]).toMatchObject({
      typeDemarche: TYPE_DEMARCHE.IMMERSION,
      apportDemarche: "J’ai vérifié que je tenais ce rythme.",
    });
    expect(result.current.hasCurrentDemarche).toBe(false);
    expect(result.current.announcement).toBe("Démarche 1 enregistrée.");
    expect(result.current.form.getValues()).toMatchObject({
      typeDemarche: undefined,
      precisionTypeDemarche: "",
      apportDemarche: "",
      piecesJustificatives: [],
    });
  });

  it("ne compte plus les champs de la démarche une fois validée, et les recompte à la suivante (maquettes 12 et 13)", async () => {
    const result = renderDemarches(IMMERSION);
    const countFields = (): number => result.current.progress.requiredFieldCount;
    const openCount = countFields();

    await act(() => result.current.validateDemarche());
    expect(countFields()).toBe(openCount - 2);

    act(() => result.current.addDemarche());
    expect(result.current.hasCurrentDemarche).toBe(true);
    expect(countFields()).toBe(openCount);
  });

  it("fait ressortir la carte d'une démarche de plus, jusqu'à ce que le focus la quitte", async () => {
    const result = renderDemarches(IMMERSION);
    expect(result.current.isHighlighted).toBe(false);
    expect(result.current.canCancel).toBe(false);
    await act(() => result.current.validateDemarche());

    act(() => result.current.addDemarche());
    expect(result.current.isHighlighted).toBe(true);
    expect(result.current.canCancel).toBe(true);

    act(() => result.current.removeHighlight());
    expect(result.current.isHighlighted).toBe(false);
  });

  it("annule la saisie d'une démarche de plus : carte refermée, saisie et erreurs effacées, sans toucher aux démarches validées", async () => {
    const result = renderDemarches(IMMERSION);
    await act(() => result.current.validateDemarche());
    act(() => result.current.addDemarche());
    act(() => result.current.form.setValue("typeDemarche", TYPE_DEMARCHE.AUTRE));
    await act(() => result.current.validateDemarche());
    expect(result.current.form.formState.errors.apportDemarche).toBeDefined();

    act(() => result.current.cancelDemarche());

    expect(result.current.demarches).toHaveLength(1);
    expect(result.current.hasCurrentDemarche).toBe(false);
    expect(result.current.isHighlighted).toBe(false);
    expect(result.current.announcement).toBe("Saisie de la démarche 2 annulée.");
    expect(result.current.form.getValues("typeDemarche")).toBeUndefined();
    expect(result.current.form.formState.errors.apportDemarche).toBeUndefined();
  });

  it("rouvre une démarche validée en saisie, préremplie, à son rang", () => {
    const [salon, autre] = createDemarches(2);
    const result = renderDemarches({ demarches: [salon, autre], hasCurrentDemarche: false });

    act(() => result.current.editDemarche(salon));

    expect(result.current.hasCurrentDemarche).toBe(true);
    expect(result.current.currentDemarcheId).toBe(salon.id);
    expect(result.current.currentDemarcheIndex).toBe(0);
    expect(result.current.canCancel).toBe(true);
    expect(result.current.isHighlighted).toBe(false);
    expect(result.current.form.getValues()).toMatchObject({
      typeDemarche: TYPE_DEMARCHE.SALON,
      apportDemarche: "J’ai rencontré trois artisans.",
    });
  });

  it("valide une modification : la démarche est mise à jour à sa place, sans en ajouter", async () => {
    const [salon, autre] = createDemarches(2);
    const result = renderDemarches({ demarches: [salon, autre], hasCurrentDemarche: false });
    act(() => result.current.editDemarche(salon));
    act(() => result.current.form.setValue("apportDemarche", "J’en ai rencontré cinq."));

    await act(() => result.current.validateDemarche());

    expect(result.current.demarches).toEqual([
      { ...salon, apportDemarche: "J’en ai rencontré cinq." },
      autre,
    ]);
    expect(result.current.hasCurrentDemarche).toBe(false);
    expect(result.current.currentDemarcheId).toBeNull();
    expect(result.current.announcement).toBe("Démarche 1 modifiée.");
    expect(result.current.form.getValues("apportDemarche")).toBe("");
  });

  it("annule une modification : la démarche reste telle qu'elle était", () => {
    const demarches = createDemarches(2);
    const result = renderDemarches({ demarches, hasCurrentDemarche: false });
    act(() => result.current.editDemarche(demarches[1]));
    act(() => result.current.form.setValue("apportDemarche", "Autre chose."));

    act(() => result.current.cancelDemarche());

    expect(result.current.demarches).toEqual(demarches);
    expect(result.current.hasCurrentDemarche).toBe(false);
    expect(result.current.currentDemarcheId).toBeNull();
    expect(result.current.announcement).toBe("Modification de la démarche 2 annulée.");
  });

  it("ne rouvre pas une démarche tant qu'une autre saisie est ouverte, et dit quoi faire d'abord", () => {
    const [salon] = createDemarches(1);
    const result = renderDemarches({ demarches: [salon], ...IMMERSION });

    act(() => result.current.editDemarche(salon));

    expect(result.current.currentDemarcheId).toBeNull();
    expect(result.current.blockedDemarcheId).toBe(salon.id);
    expect(result.current.announcement).toBe(
      "Validez ou annulez la démarche en cours avant de modifier celle-ci.",
    );
    // La saisie en cours n'a pas bougé.
    expect(result.current.form.getValues("typeDemarche")).toBe(TYPE_DEMARCHE.IMMERSION);

    act(() => result.current.cancelDemarche());
    expect(result.current.blockedDemarcheId).toBeNull();
  });

  it("demande confirmation avant de supprimer une démarche, et ne touche à rien si on abandonne", () => {
    const demarches = createDemarches(2);
    const result = renderDemarches({ demarches, hasCurrentDemarche: false });

    act(() => result.current.requestRemoval(demarches[1]));
    expect(result.current.isRemovalOpen).toBe(true);
    expect(result.current.removal).toEqual({
      items: [{ demarche: demarches[1], index: 1 }],
      isAnswerNon: false,
    });

    act(() => result.current.cancelRemoval());
    expect(result.current.isRemovalOpen).toBe(false);
    expect(result.current.demarches).toEqual(demarches);
  });

  it("supprime la démarche confirmée, une seule, et l'annonce par son rang", () => {
    const [salon, autre, derniere] = createDemarches(3);
    const result = renderDemarches({
      demarches: [salon, autre, derniere],
      hasCurrentDemarche: false,
    });
    act(() => result.current.requestRemoval(autre));

    act(() => result.current.confirmRemoval());

    expect(result.current.demarches).toEqual([salon, derniere]);
    expect(result.current.isRemovalOpen).toBe(false);
    expect(result.current.hasCurrentDemarche).toBe(false);
    expect(result.current.announcement).toBe("Démarche 2 supprimée.");
  });

  it("rouvre la saisie de la première démarche quand la dernière est supprimée", () => {
    const [salon] = createDemarches(1);
    const result = renderDemarches({ demarches: [salon], hasCurrentDemarche: false });
    act(() => result.current.requestRemoval(salon));

    act(() => result.current.confirmRemoval());

    expect(result.current.demarches).toEqual([]);
    expect(result.current.hasCurrentDemarche).toBe(true);
    expect(result.current.currentDemarcheIndex).toBe(0);
    expect(result.current.canCancel).toBe(false);
  });

  it("supprime une démarche sans toucher à la saisie en cours", () => {
    const [salon] = createDemarches(1);
    const result = renderDemarches({ demarches: [salon], ...IMMERSION });
    act(() => result.current.requestRemoval(salon));

    act(() => result.current.confirmRemoval());

    expect(result.current.demarches).toEqual([]);
    expect(result.current.hasCurrentDemarche).toBe(true);
    expect(result.current.form.getValues("typeDemarche")).toBe(TYPE_DEMARCHE.IMMERSION);
  });

  /** Le formulaire reçoit la réponse, puis le hook en est prévenu, comme le fait `FormRadioGroup`. */
  function answer(
    result: { current: Result },
    value: FuturMetierFormData["demarcheDecouverte"],
  ): void {
    act(() => {
      result.current.form.setValue("demarcheDecouverte", value);
      result.current.changeAnswer(value);
    });
  }

  it("fait confirmer un « non » qui emporterait des démarches validées : la réponse reste « oui »", () => {
    const demarches = createDemarches(2);
    const result = renderDemarches({ demarches, hasCurrentDemarche: false });

    answer(result, OUI_NON.NON);

    expect(result.current.form.getValues("demarcheDecouverte")).toBe(OUI_NON.OUI);
    expect(result.current.isRemovalOpen).toBe(true);
    expect(result.current.removal).toEqual({
      items: [
        { demarche: demarches[0], index: 0 },
        { demarche: demarches[1], index: 1 },
      ],
      isAnswerNon: true,
    });

    act(() => result.current.cancelRemoval());
    expect(result.current.isRemovalOpen).toBe(false);
    expect(result.current.form.getValues("demarcheDecouverte")).toBe(OUI_NON.OUI);
    expect(result.current.demarches).toEqual(demarches);
  });

  it("supprime toutes les démarches quand le « non » est confirmé, et repart d'une saisie vide", () => {
    const [salon, autre] = createDemarches(2);
    const result = renderDemarches({ demarches: [salon, autre], hasCurrentDemarche: false });
    act(() => result.current.editDemarche(salon));
    answer(result, OUI_NON.NON);

    act(() => result.current.confirmRemoval());

    expect(result.current.form.getValues()).toMatchObject({
      demarcheDecouverte: OUI_NON.NON,
      demarches: [],
      currentDemarcheId: null,
      hasCurrentDemarche: true,
      typeDemarche: undefined,
      apportDemarche: "",
    });
    expect(result.current.isRemovalOpen).toBe(false);
    expect(result.current.announcement).toBe("Vos démarches ont été supprimées.");
  });

  it("accepte un « non » sans fenêtre quand aucune démarche n'est validée, en gardant la saisie en cours", () => {
    const result = renderDemarches(IMMERSION);

    answer(result, OUI_NON.NON);

    expect(result.current.isRemovalOpen).toBe(false);
    expect(result.current.form.getValues()).toMatchObject({
      demarcheDecouverte: OUI_NON.NON,
      typeDemarche: TYPE_DEMARCHE.IMMERSION,
    });
  });

  it("n'ajoute pas une saisie restée ouverte quand le maximum est déjà atteint", async () => {
    const demarches = createDemarches(NOMBRE_MAX_DEMARCHES);
    const result = renderDemarches({ demarches, ...IMMERSION });

    await act(() => result.current.validateDemarche());

    expect(result.current.demarches).toHaveLength(NOMBRE_MAX_DEMARCHES);
  });

  it("ne demande pas de supprimer une démarche qui n'est pas dans la liste", () => {
    const [salon, absente] = createDemarches(2);
    const result = renderDemarches({ demarches: [salon], hasCurrentDemarche: false });

    act(() => result.current.requestRemoval(absente));

    expect(result.current.isRemovalOpen).toBe(false);
    expect(result.current.removal).toBeNull();
  });

  it("redit une annonce identique à la précédente", () => {
    const demarches = createDemarches(3);
    const result = renderDemarches({ demarches, hasCurrentDemarche: false });
    act(() => result.current.requestRemoval(demarches[0]));
    act(() => result.current.confirmRemoval());
    const first = result.current.announcement;

    act(() => result.current.requestRemoval(demarches[1]));
    act(() => result.current.confirmRemoval());

    expect(first).toBe("Démarche 1 supprimée.");
    expect(result.current.announcement).not.toBe(first);
    expect(result.current.announcement.trim()).toBe(first);
  });

  it("n'ouvre plus de saisie quand le nombre maximal de démarches est atteint", () => {
    const result = renderDemarches({
      demarches: createDemarches(NOMBRE_MAX_DEMARCHES),
      hasCurrentDemarche: false,
    });
    expect(result.current.canAdd).toBe(false);

    act(() => result.current.addDemarche());

    expect(result.current.hasCurrentDemarche).toBe(false);
  });
});
