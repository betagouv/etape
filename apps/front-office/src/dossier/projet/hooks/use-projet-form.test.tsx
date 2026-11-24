// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { afterEach, describe, expect, it } from "vitest";

import { OUI_NON } from "../../domain/oui-non";
import { TYPE_DEMARCHE } from "../domain/type-demarche";
import { PROJET_FIELD, PROJET_SECTION, type ProjetFormData } from "../schema";
import { useProjetForm, type UseProjetFormResult } from "./use-projet-form";

afterEach(cleanup);

/** Les quatre zones de texte remplies : il ne reste que la question sur les démarches. */
const FILLED_TEXTS: Partial<ProjetFormData> = {
  motivationChangement: "Je veux un métier manuel, au contact des clients.",
  effetsChangement: "Des horaires décalés et un revenu plus faible la première année.",
  competencesAcquises: "La rigueur et l’organisation acquises en logistique.",
  competencesAAcquerir: "Les techniques de fabrication et les règles d’hygiène.",
};

type Form = UseProjetFormResult["form"];

function renderForm(): { current: UseProjetFormResult } {
  return renderHook(() => useProjetForm()).result;
}

/** Saisit une valeur dans un champ de texte, puis le quitte : c'est sa sortie qui le valide. */
async function fillAndLeave(field: UseFormRegisterReturn, value: string): Promise<void> {
  const input = document.createElement("textarea");
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

function setValues(form: Form, values: Partial<ProjetFormData>): void {
  act(() => {
    form.reset({ ...form.getValues(), ...values });
  });
}

describe("useProjetForm", () => {
  it("demande cinq champs quand rien n'est saisi : deux pour le projet, deux pour les compétences, un pour les démarches (maquette 01)", () => {
    const result = renderForm();

    expect(result.current.progress).toEqual({
      requiredFieldCount: 5,
      filledFieldCount: 0,
      remainingFieldCount: 5,
      errorCount: 0,
    });
    expect(result.current.sections).toEqual({
      [PROJET_SECTION.PROJET]: { remainingFieldCount: 2, errorCount: 0 },
      [PROJET_SECTION.COMPETENCES]: { remainingFieldCount: 2, errorCount: 0 },
      [PROJET_SECTION.DEMARCHES]: { remainingFieldCount: 1, errorCount: 0 },
    });
    expect(result.current.voletErrors).toEqual([]);
    expect(result.current.errorAnnouncement).toBe("");
  });

  it("ne laisse que la question sur les démarches une fois les quatre zones de texte remplies", () => {
    const result = renderForm();

    setValues(result.current.form, FILLED_TEXTS);

    expect(result.current.progress.remainingFieldCount).toBe(1);
    expect(result.current.sections[PROJET_SECTION.PROJET].remainingFieldCount).toBe(0);
    expect(result.current.sections[PROJET_SECTION.COMPETENCES].remainingFieldCount).toBe(0);
  });

  it("est complet après un « non » (maquette 02)", () => {
    const result = renderForm();

    setValues(result.current.form, { ...FILLED_TEXTS, demarcheConstruction: OUI_NON.NON });

    expect(result.current.progress).toEqual({
      requiredFieldCount: 5,
      filledFieldCount: 5,
      remainingFieldCount: 0,
      errorCount: 0,
    });
  });

  it("après un « oui », compte le type et l'apport de la démarche : deux champs restants (maquette 03)", () => {
    const result = renderForm();

    setValues(result.current.form, { demarcheConstruction: OUI_NON.OUI });

    expect(result.current.sections[PROJET_SECTION.DEMARCHES].remainingFieldCount).toBe(2);
  });

  it("compte la précision à remplir une fois « Autre » choisi, puis plus rien quand la saisie est remplie (maquette 04)", () => {
    const result = renderForm();
    setValues(result.current.form, FILLED_TEXTS);

    setValues(result.current.form, {
      demarcheConstruction: OUI_NON.OUI,
      typeDemarche: TYPE_DEMARCHE.AUTRE,
    });
    expect(result.current.progress.remainingFieldCount).toBe(2);

    setValues(result.current.form, {
      precisionTypeDemarche: "Atelier de mon opérateur CEP",
      apportDemarche: "J’ai identifié ce qui me motive.",
    });
    expect(result.current.progress.remainingFieldCount).toBe(0);
  });

  it("à l'envoi d'un volet vide, liste les cinq champs manquants dans l'ordre de la page", async () => {
    const result = renderForm();

    await submit(result.current.form);

    expect(result.current.progress.errorCount).toBe(5);
    expect(result.current.sections).toEqual({
      [PROJET_SECTION.PROJET]: { remainingFieldCount: 2, errorCount: 2 },
      [PROJET_SECTION.COMPETENCES]: { remainingFieldCount: 2, errorCount: 2 },
      [PROJET_SECTION.DEMARCHES]: { remainingFieldCount: 1, errorCount: 1 },
    });
    expect(result.current.voletErrors).toEqual([
      {
        fieldId: "motivationChangement",
        message: "Veuillez indiquer pourquoi vous souhaitez changer de métier.",
      },
      {
        fieldId: "effetsChangement",
        message: "Veuillez indiquer ce que ce changement va modifier dans votre situation.",
      },
      {
        fieldId: "competencesAcquises",
        message:
          "Veuillez indiquer les compétences de votre parcours qui vous serviront dans votre futur métier.",
      },
      {
        fieldId: "competencesAAcquerir",
        message: "Veuillez indiquer les compétences qu’il vous reste à acquérir.",
      },
      {
        fieldId: "demarcheConstruction",
        message:
          "Veuillez indiquer si vous avez réalisé une démarche pour construire votre projet.",
      },
    ]);
  });

  it("à l'envoi après un « oui », liste les champs de la démarche à la fin du résumé", async () => {
    const result = renderForm();
    setValues(result.current.form, { ...FILLED_TEXTS, demarcheConstruction: OUI_NON.OUI });

    await submit(result.current.form);

    expect(result.current.voletErrors).toEqual([
      { fieldId: "typeDemarche", message: "Veuillez choisir le type de démarche." },
      {
        fieldId: "apportDemarche",
        message: "Veuillez indiquer ce que la démarche vous a apporté.",
      },
    ]);
    // L'envoi n'est pas annoncé ici : le résumé d'erreurs, focalisé, le porte.
    expect(result.current.errorAnnouncement).toBe("");
  });

  it("ne compte plus les erreurs de la démarche après un retour à « non »", async () => {
    const result = renderForm();
    setValues(result.current.form, { ...FILLED_TEXTS, demarcheConstruction: OUI_NON.OUI });
    await submit(result.current.form);

    setValues(result.current.form, { demarcheConstruction: OUI_NON.NON });

    expect(result.current.progress.errorCount).toBe(0);
    expect(result.current.voletErrors).toEqual([]);
  });

  it("annonce l'erreur de la zone de texte quittée, suivie du statut du volet", async () => {
    const result = renderForm();
    setValues(result.current.form, { ...FILLED_TEXTS, demarcheConstruction: OUI_NON.NON });

    await fillAndLeave(result.current.form.register(PROJET_FIELD.EFFETS_CHANGEMENT), " ");

    expect(result.current.errorAnnouncement).toBe(
      "Qu’est-ce que ce changement va modifier dans votre situation ? : Veuillez indiquer ce que ce changement va modifier dans votre situation. " +
        "Mon projet : 1 erreur à corriger et 1 champ restant.",
    );
  });
});
