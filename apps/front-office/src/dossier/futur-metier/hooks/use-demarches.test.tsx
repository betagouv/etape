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
