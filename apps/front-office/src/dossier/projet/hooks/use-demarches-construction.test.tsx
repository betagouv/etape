// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { EMPTY_CURRENT_DEMARCHE, type CurrentDemarche, type Demarche } from "../../domain/demarche";
import { OUI_NON } from "../../domain/oui-non";
import type { UseDemarchesResult } from "../../hooks/use-demarches";
import { TYPE_DEMARCHE, type TypeDemarche } from "../domain/type-demarche";
import { PROJET_FIELD, type ProjetFormData } from "../schema";
import { useDemarchesConstruction } from "./use-demarches-construction";
import { useProjetForm, type UseProjetFormResult } from "./use-projet-form";

afterEach(cleanup);

type Result = UseProjetFormResult & UseDemarchesResult<TypeDemarche>;

/** Le formulaire du volet et ses démarches, « oui » répondu et saisie en cours remplie de `values`. */
function renderDemarches(values: Partial<ProjetFormData> = {}): { current: Result } {
  const { result } = renderHook(() => {
    const volet = useProjetForm();
    return { ...volet, ...useDemarchesConstruction(volet.form) };
  });
  act(() => {
    const { form } = result.current;
    form.reset({ ...form.getValues(), demarcheConstruction: OUI_NON.OUI, ...values });
  });
  return result;
}

const BILAN: CurrentDemarche<TypeDemarche> = {
  ...EMPTY_CURRENT_DEMARCHE,
  typeDemarche: TYPE_DEMARCHE.BILAN_COMPETENCES,
  apportDemarche: "J’ai identifié ce qui me motive.",
};

const VAE: Demarche<TypeDemarche> = {
  id: "a",
  typeDemarche: TYPE_DEMARCHE.VAE,
  precisionTypeDemarche: "",
  apportDemarche: "J’ai fait reconnaître mon expérience.",
  piecesJustificatives: [],
};

// Le comportement des démarches est testé avec `useDemarches` ; ici, ce qui le relie au volet.
describe("useDemarchesConstruction", () => {
  it("signale les champs de la démarche avec les messages du volet, sans toucher à ses autres champs", async () => {
    const result = renderDemarches({
      currentDemarche: { ...EMPTY_CURRENT_DEMARCHE, typeDemarche: TYPE_DEMARCHE.AUTRE },
    });

    await act(() => result.current.currentDemarche.validate());

    const { errors } = result.current.form.formState;
    expect(errors.currentDemarche?.precisionTypeDemarche?.message).toBe(
      "Veuillez préciser le type de démarche.",
    );
    expect(errors.currentDemarche?.apportDemarche?.message).toBe(
      "Veuillez indiquer ce que la démarche vous a apporté.",
    );
    expect(errors.motivationChangement).toBeUndefined();
  });

  it("écrit la démarche validée dans le volet et vide la saisie", async () => {
    const result = renderDemarches({ currentDemarche: BILAN });

    await act(() => result.current.currentDemarche.validate());

    const values = result.current.form.getValues();
    expect(values.demarches).toHaveLength(1);
    expect(values.demarches[0]).toMatchObject(BILAN);
    expect(values).toMatchObject({ hasCurrentDemarche: false, currentDemarcheId: null });
    expect(values.currentDemarche).toEqual(EMPTY_CURRENT_DEMARCHE);
  });

  it("ne compte plus les champs de la démarche une fois validée, et les recompte à la suivante", async () => {
    const result = renderDemarches({ currentDemarche: BILAN });
    const countFields = (): number => result.current.progress.requiredFieldCount;
    const openCount = countFields();

    await act(() => result.current.currentDemarche.validate());
    expect(countFields()).toBe(openCount - 2);

    act(() => result.current.list.add());
    expect(result.current.currentDemarche.isOpen).toBe(true);
    expect(countFields()).toBe(openCount);
  });

  it("remet une démarche validée dans les champs de saisie du volet", () => {
    const result = renderDemarches({ demarches: [VAE], hasCurrentDemarche: false });

    act(() => result.current.list.edit(VAE));

    expect(result.current.form.getValues()).toMatchObject({
      hasCurrentDemarche: true,
      currentDemarcheId: VAE.id,
      currentDemarche: {
        typeDemarche: TYPE_DEMARCHE.VAE,
        apportDemarche: VAE.apportDemarche,
      },
    });
  });

  it("répond « non » à la question du volet quand la suppression de ses démarches est confirmée", () => {
    const result = renderDemarches({ demarches: [VAE], hasCurrentDemarche: false });
    act(() => {
      result.current.form.setValue(PROJET_FIELD.DEMARCHE_CONSTRUCTION, OUI_NON.NON);
      result.current.changeAnswer(OUI_NON.NON);
    });
    // La réponse reste « oui » tant que la fenêtre n'est pas confirmée.
    expect(result.current.form.getValues(PROJET_FIELD.DEMARCHE_CONSTRUCTION)).toBe(OUI_NON.OUI);

    act(() => result.current.removalDialog.confirmRemoval());

    expect(result.current.form.getValues()).toMatchObject({
      demarcheConstruction: OUI_NON.NON,
      demarches: [],
      hasCurrentDemarche: true,
    });
  });
});
