// @vitest-environment jsdom
import type { AppellationRome } from "@etape/api-contract";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FUTUR_METIER_SECTION, METIER_VISE_ENTRY_MODE, type FuturMetierFormData } from "../schema";
import { useFuturMetierForm, type UseFuturMetierFormResult } from "./use-futur-metier-form";

afterEach(cleanup);

const BOULANGER: AppellationRome = {
  code: "11573",
  libelle: "Boulanger / Boulangère",
  metierRome: { code: "D1102", libelle: "Boulangerie - viennoiserie" },
};

type Form = UseFuturMetierFormResult["form"];

function renderForm(): { current: UseFuturMetierFormResult } {
  return renderHook(() => useFuturMetierForm()).result;
}

/** Saisit l'intitulé du métier, puis quitte le champ : c'est sa sortie qui le valide. */
async function fillAndLeaveIntitule(form: Form, value: string): Promise<void> {
  const input = document.createElement("input");
  const field = form.register("intituleMetierVise");
  input.name = field.name;
  field.ref(input);
  input.value = value;
  await act(async () => {
    await field.onChange({ target: input, type: "change" });
    await field.onBlur({ target: input, type: "blur" });
  });
}

async function submit(form: Form): Promise<void> {
  await act(async () => {
    await form.handleSubmit(() => undefined)();
  });
}

function setValues(form: Form, values: Partial<FuturMetierFormData>): void {
  act(() => {
    form.reset({ ...form.getValues(), ...values });
  });
}

describe("useFuturMetierForm", () => {
  it("demande un champ, celui du métier, quand rien n'est saisi", () => {
    const result = renderForm();

    expect(result.current.progress).toEqual({
      requiredFieldCount: 1,
      filledFieldCount: 0,
      remainingFieldCount: 1,
      errorCount: 0,
    });
    expect(result.current.sections).toEqual({
      [FUTUR_METIER_SECTION.METIER_VISE]: { remainingFieldCount: 1, errorCount: 0 },
    });
    expect(result.current.voletErrors).toEqual([]);
    expect(result.current.errorAnnouncement).toBe("");
  });

  it("ne laisse aucun champ restant une fois le métier choisi", () => {
    const result = renderForm();

    setValues(result.current.form, { metierVise: BOULANGER });

    expect(result.current.progress.remainingFieldCount).toBe(0);
    expect(result.current.sections[FUTUR_METIER_SECTION.METIER_VISE].remainingFieldCount).toBe(0);
  });

  it("en saisie manuelle, demande l'intitulé et pas le code ROME", () => {
    const result = renderForm();

    setValues(result.current.form, { metierViseEntryMode: METIER_VISE_ENTRY_MODE.MANUAL });
    expect(result.current.progress.remainingFieldCount).toBe(1);

    setValues(result.current.form, { intituleMetierVise: "Pâtissier" });
    expect(result.current.progress).toEqual({
      requiredFieldCount: 1,
      filledFieldCount: 1,
      remainingFieldCount: 0,
      errorCount: 0,
    });
  });

  it("à l'envoi sans métier, compte l'erreur et la porte au résumé", async () => {
    const result = renderForm();

    await submit(result.current.form);

    expect(result.current.progress.errorCount).toBe(1);
    expect(result.current.sections[FUTUR_METIER_SECTION.METIER_VISE].errorCount).toBe(1);
    expect(result.current.voletErrors).toEqual([
      { fieldId: "metierVise", message: "Veuillez choisir le métier que vous visez." },
    ]);
    // L'envoi n'est pas annoncé ici : le résumé d'erreurs, focalisé, le porte.
    expect(result.current.errorAnnouncement).toBe("");
  });

  it("annonce l'erreur du champ quitté, suivie du statut du volet", async () => {
    const result = renderForm();
    setValues(result.current.form, { metierViseEntryMode: METIER_VISE_ENTRY_MODE.MANUAL });

    await fillAndLeaveIntitule(result.current.form, " ");

    expect(result.current.errorAnnouncement).toBe(
      "Nom du métier que vous visez : Veuillez saisir le nom du métier que vous visez. " +
        "Mon futur métier : 1 erreur à corriger et 1 champ restant.",
    );
  });

  it("annonce le volet complet quand l'intitulé quitté est rempli", async () => {
    const result = renderForm();
    setValues(result.current.form, { metierViseEntryMode: METIER_VISE_ENTRY_MODE.MANUAL });

    await fillAndLeaveIntitule(result.current.form, "Pâtissier");

    expect(result.current.errorAnnouncement).toBe("Mon futur métier : complet.");
    expect(result.current.voletErrors).toEqual([]);
  });
});
