// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { Demarche } from "../../domain/demarche";
import { OUI_NON } from "../../domain/oui-non";
import type { UseDemarchesResult } from "../../hooks/use-demarches";
import { TYPE_DEMARCHE, type TypeDemarche } from "../domain/type-demarche";
import { FUTUR_METIER_FIELD, type FuturMetierFormData } from "../schema";
import { useDemarchesDecouverte } from "./use-demarches-decouverte";
import { useFuturMetierForm, type UseFuturMetierFormResult } from "./use-futur-metier-form";

afterEach(cleanup);

type Result = UseFuturMetierFormResult & UseDemarchesResult<TypeDemarche>;

/** Le formulaire du volet et ses démarches, « oui » répondu et saisie en cours remplie de `values`. */
function renderDemarches(values: Partial<FuturMetierFormData> = {}): { current: Result } {
  const { result } = renderHook(() => {
    const volet = useFuturMetierForm();
    return { ...volet, ...useDemarchesDecouverte(volet.form) };
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

const SALON: Demarche<TypeDemarche> = {
  id: "a",
  typeDemarche: TYPE_DEMARCHE.SALON,
  precisionTypeDemarche: "",
  apportDemarche: "J’ai rencontré trois artisans.",
  piecesJustificatives: [],
};

// Le comportement des démarches est testé avec `useDemarches` ; ici, ce qui le relie au volet.
describe("useDemarchesDecouverte", () => {
  it("signale les champs de la démarche avec les messages du volet, sans toucher à ses autres champs", async () => {
    const result = renderDemarches({ typeDemarche: TYPE_DEMARCHE.AUTRE });

    await act(() => result.current.validateDemarche());

    const { errors } = result.current.form.formState;
    expect(errors.precisionTypeDemarche?.message).toBe("Veuillez préciser le type de démarche.");
    expect(errors.apportDemarche?.message).toBe(
      "Veuillez indiquer ce que la démarche vous a apporté.",
    );
    expect(errors.quotidienMetier).toBeUndefined();
  });

  it("écrit la démarche validée dans le volet et vide la saisie", async () => {
    const result = renderDemarches(IMMERSION);

    await act(() => result.current.validateDemarche());

    const values = result.current.form.getValues();
    expect(values.demarches).toHaveLength(1);
    expect(values.demarches[0]).toMatchObject(IMMERSION);
    expect(values).toMatchObject({
      hasCurrentDemarche: false,
      currentDemarcheId: null,
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

  it("remet une démarche validée dans les champs de saisie du volet", () => {
    const result = renderDemarches({ demarches: [SALON], hasCurrentDemarche: false });

    act(() => result.current.editDemarche(SALON));

    expect(result.current.form.getValues()).toMatchObject({
      hasCurrentDemarche: true,
      currentDemarcheId: SALON.id,
      typeDemarche: TYPE_DEMARCHE.SALON,
      apportDemarche: SALON.apportDemarche,
    });
  });

  it("répond « non » à la question du volet quand la suppression de ses démarches est confirmée", () => {
    const result = renderDemarches({ demarches: [SALON], hasCurrentDemarche: false });
    act(() => {
      result.current.form.setValue(FUTUR_METIER_FIELD.DEMARCHE_DECOUVERTE, OUI_NON.NON);
      result.current.changeAnswer(OUI_NON.NON);
    });
    // La réponse reste « oui » tant que la fenêtre n'est pas confirmée.
    expect(result.current.form.getValues(FUTUR_METIER_FIELD.DEMARCHE_DECOUVERTE)).toBe(OUI_NON.OUI);

    act(() => result.current.confirmRemoval());

    expect(result.current.form.getValues()).toMatchObject({
      demarcheDecouverte: OUI_NON.NON,
      demarches: [],
      hasCurrentDemarche: true,
    });
  });
});
