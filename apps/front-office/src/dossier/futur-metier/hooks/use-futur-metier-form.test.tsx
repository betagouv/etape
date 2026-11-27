// @vitest-environment jsdom
import type { AppellationRome } from "@etape/api-contract";
import { act, cleanup, renderHook } from "@testing-library/react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { afterEach, describe, expect, it } from "vitest";

import { ENTRY_MODE } from "../../domain/entry-mode";
import { OUI_NON } from "../../domain/oui-non";
import { TYPE_DEMARCHE } from "../domain/type-demarche";
import { FUTUR_METIER_FIELD, FUTUR_METIER_SECTION, type FuturMetierFormData } from "../schema";
import { useFuturMetierForm, type UseFuturMetierFormResult } from "./use-futur-metier-form";

afterEach(cleanup);

const BOULANGER: AppellationRome = {
  code: "11573",
  libelle: "Boulanger / Boulangère",
  metierRome: { code: "D1102", libelle: "Boulangerie - viennoiserie" },
};

/** Les perspectives d'emploi remplies, sans contact avec des employeurs. */
const FILLED_PERSPECTIVES_EMPLOI: Partial<FuturMetierFormData> = {
  zoneRechercheEmploi: "Bordeaux et ses environs",
  demenagement: OUI_NON.NON,
  contactEmployeurs: OUI_NON.NON,
};

/** Les zones de texte remplies et les questions répondues : il ne reste que le métier visé à saisir. */
const FILLED_TEXTS: Partial<FuturMetierFormData> = {
  quotidienMetier: "Pétrir, façonner et cuire le pain, tôt le matin.",
  conditionsEmploi: "Surtout des CDI, en boulangerie artisanale.",
  debouches: "De nombreuses offres non pourvues dans ma région.",
  demarcheDecouverte: OUI_NON.NON,
  ...FILLED_PERSPECTIVES_EMPLOI,
};

type Form = UseFuturMetierFormResult["form"];

function renderForm(): { current: UseFuturMetierFormResult } {
  return renderHook(() => useFuturMetierForm()).result;
}

/** Saisit une valeur dans un champ de texte, puis le quitte : c'est sa sortie qui le valide. */
async function fillAndLeave(field: UseFormRegisterReturn, value: string): Promise<void> {
  const input = document.createElement("input");
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
  it("demande huit champs quand rien n'est saisi : cinq pour le métier, trois pour les perspectives d'emploi", () => {
    const result = renderForm();

    expect(result.current.progress).toEqual({
      requiredFieldCount: 8,
      filledFieldCount: 0,
      remainingFieldCount: 8,
      errorCount: 0,
    });
    expect(result.current.sections).toEqual({
      [FUTUR_METIER_SECTION.METIER_VISE]: { remainingFieldCount: 5, errorCount: 0 },
      [FUTUR_METIER_SECTION.PERSPECTIVES_EMPLOI]: { remainingFieldCount: 3, errorCount: 0 },
    });
    expect(result.current.voletErrors).toEqual([]);
    expect(result.current.errorAnnouncement).toBe("");
  });

  it("ne compte pas la spécialisation, facultative, parmi les champs à remplir", () => {
    const result = renderForm();

    setValues(result.current.form, { specialisation: "pâtisserie" });

    expect(result.current.progress.requiredFieldCount).toBe(8);
    expect(result.current.progress.remainingFieldCount).toBe(8);
  });

  it("ne laisse que le métier à saisir une fois les trois zones de texte remplies", () => {
    const result = renderForm();

    setValues(result.current.form, FILLED_TEXTS);

    expect(result.current.progress.remainingFieldCount).toBe(1);
    expect(result.current.sections[FUTUR_METIER_SECTION.METIER_VISE].remainingFieldCount).toBe(1);
  });

  it("ne laisse aucun champ restant une fois le métier choisi", () => {
    const result = renderForm();

    setValues(result.current.form, { ...FILLED_TEXTS, metierVise: BOULANGER });

    expect(result.current.progress.remainingFieldCount).toBe(0);
    expect(result.current.sections[FUTUR_METIER_SECTION.METIER_VISE].remainingFieldCount).toBe(0);
  });

  it("ne compte plus la question sur les démarches une fois répondue « non »", () => {
    const result = renderForm();

    setValues(result.current.form, { demarcheDecouverte: OUI_NON.NON });

    expect(result.current.progress.remainingFieldCount).toBe(7);
  });

  it("après un « oui », compte le type et l'apport de la démarche : cinq champs restants une fois le métier choisi (maquette 10)", () => {
    const result = renderForm();

    setValues(result.current.form, { metierVise: BOULANGER, demarcheDecouverte: OUI_NON.OUI });

    expect(result.current.sections[FUTUR_METIER_SECTION.METIER_VISE].remainingFieldCount).toBe(5);
  });

  it("compte la précision à remplir une fois « Autre » choisi", () => {
    const result = renderForm();
    setValues(result.current.form, { ...FILLED_TEXTS, metierVise: BOULANGER });

    setValues(result.current.form, {
      demarcheDecouverte: OUI_NON.OUI,
      typeDemarche: TYPE_DEMARCHE.AUTRE,
    });
    expect(result.current.progress.remainingFieldCount).toBe(2);

    setValues(result.current.form, {
      precisionTypeDemarche: "Stage chez un artisan",
      apportDemarche: "J’ai vérifié que je tenais ce rythme.",
    });
    expect(result.current.progress.remainingFieldCount).toBe(0);
  });

  it("à l'envoi après un « oui », liste les champs de la démarche à la fin du résumé", async () => {
    const result = renderForm();
    setValues(result.current.form, {
      ...FILLED_TEXTS,
      metierVise: BOULANGER,
      demarcheDecouverte: OUI_NON.OUI,
    });

    await submit(result.current.form);

    expect(result.current.voletErrors).toEqual([
      { fieldId: "typeDemarche", message: "Veuillez choisir le type de démarche." },
      {
        fieldId: "apportDemarche",
        message: "Veuillez indiquer ce que la démarche vous a apporté.",
      },
    ]);
  });

  it("ne compte plus les erreurs de la démarche après un retour à « non »", async () => {
    const result = renderForm();
    setValues(result.current.form, {
      ...FILLED_TEXTS,
      metierVise: BOULANGER,
      demarcheDecouverte: OUI_NON.OUI,
    });
    await submit(result.current.form);

    setValues(result.current.form, { demarcheDecouverte: OUI_NON.NON });

    expect(result.current.progress.errorCount).toBe(0);
    expect(result.current.voletErrors).toEqual([]);
  });

  it("en saisie manuelle, demande l'intitulé et pas le code ROME", () => {
    const result = renderForm();

    setValues(result.current.form, {
      ...FILLED_TEXTS,
      metierViseEntryMode: ENTRY_MODE.MANUAL,
    });
    expect(result.current.progress.remainingFieldCount).toBe(1);

    setValues(result.current.form, { intituleMetierVise: "Pâtissier" });
    expect(result.current.progress).toEqual({
      requiredFieldCount: 8,
      filledFieldCount: 8,
      remainingFieldCount: 0,
      errorCount: 0,
    });
  });

  it("à l'envoi d'un volet vide, liste les huit champs manquants dans l'ordre de la page", async () => {
    const result = renderForm();

    await submit(result.current.form);

    expect(result.current.progress.errorCount).toBe(8);
    expect(result.current.voletErrors).toEqual([
      { fieldId: "metierVise", message: "Veuillez choisir le métier que vous visez." },
      { fieldId: "quotidienMetier", message: "Veuillez décrire le quotidien de ce métier." },
      {
        fieldId: "conditionsEmploi",
        message: "Veuillez indiquer les conditions habituelles d’emploi dans le métier visé.",
      },
      {
        fieldId: "debouches",
        message: "Veuillez indiquer ce que vous savez des débouchés dans ce métier.",
      },
      {
        fieldId: "demarcheDecouverte",
        message: "Veuillez indiquer si vous avez entrepris des démarches pour découvrir ce métier.",
      },
      {
        fieldId: "zoneRechercheEmploi",
        message: "Veuillez indiquer la zone où vous chercherez un emploi.",
      },
      { fieldId: "demenagement", message: "Veuillez indiquer si vous envisagez de déménager." },
      {
        fieldId: "contactEmployeurs",
        message: "Veuillez indiquer si vous avez déjà des contacts avec des employeurs.",
      },
    ]);
  });

  it("à l'envoi sans métier, compte l'erreur et la porte au résumé", async () => {
    const result = renderForm();
    setValues(result.current.form, FILLED_TEXTS);

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
    setValues(result.current.form, {
      ...FILLED_TEXTS,
      metierViseEntryMode: ENTRY_MODE.MANUAL,
    });

    await fillAndLeave(result.current.form.register("intituleMetierVise"), " ");

    expect(result.current.errorAnnouncement).toBe(
      "Nom du métier que vous visez : Veuillez saisir le nom du métier que vous visez. " +
        "Mon futur métier : 1 erreur à corriger et 1 champ restant.",
    );
  });

  it("annonce le volet complet quand l'intitulé quitté est rempli", async () => {
    const result = renderForm();
    setValues(result.current.form, {
      ...FILLED_TEXTS,
      metierViseEntryMode: ENTRY_MODE.MANUAL,
    });

    await fillAndLeave(result.current.form.register("intituleMetierVise"), "Pâtissier");

    expect(result.current.errorAnnouncement).toBe("Mon futur métier : complet.");
    expect(result.current.voletErrors).toEqual([]);
  });

  it("compte l'erreur d'un champ facultatif : un code ROME faux n'est pas un volet complet", async () => {
    const result = renderForm();
    setValues(result.current.form, {
      ...FILLED_TEXTS,
      metierViseEntryMode: ENTRY_MODE.MANUAL,
      intituleMetierVise: "Pâtissier",
      codeRome: "M18",
    });

    await submit(result.current.form);

    expect(result.current.progress).toEqual({
      requiredFieldCount: 8,
      filledFieldCount: 8,
      remainingFieldCount: 0,
      errorCount: 1,
    });
    expect(result.current.sections).toEqual({
      [FUTUR_METIER_SECTION.METIER_VISE]: { remainingFieldCount: 0, errorCount: 1 },
      [FUTUR_METIER_SECTION.PERSPECTIVES_EMPLOI]: { remainingFieldCount: 0, errorCount: 0 },
    });
    expect(result.current.voletErrors).toEqual([
      {
        fieldId: "codeRome",
        message: "Le code ROME comporte une lettre suivie de quatre chiffres, par exemple D1102.",
      },
    ]);
  });

  it("liste au résumé l'intitulé manquant avant le code ROME faux, dans l'ordre de la page", async () => {
    const result = renderForm();
    setValues(result.current.form, {
      ...FILLED_TEXTS,
      metierViseEntryMode: ENTRY_MODE.MANUAL,
      codeRome: "M18",
    });

    await submit(result.current.form);

    expect(result.current.voletErrors.map(({ fieldId }) => fieldId)).toEqual([
      "intituleMetierVise",
      "codeRome",
    ]);
    expect(result.current.progress.errorCount).toBe(2);
  });

  it("annonce le code ROME faux qu'on vient de quitter, et le volet à corriger", async () => {
    const result = renderForm();
    setValues(result.current.form, {
      ...FILLED_TEXTS,
      metierViseEntryMode: ENTRY_MODE.MANUAL,
      intituleMetierVise: "Pâtissier",
    });

    await fillAndLeave(result.current.form.register("codeRome"), "M18");

    expect(result.current.errorAnnouncement).toBe(
      "Code ROME : Le code ROME comporte une lettre suivie de quatre chiffres, par exemple D1102. " +
        "Mon futur métier : 1 erreur à corriger.",
    );
  });

  it("ne compte plus l'erreur du code ROME une fois revenu à la recherche", async () => {
    const result = renderForm();
    setValues(result.current.form, {
      ...FILLED_TEXTS,
      metierViseEntryMode: ENTRY_MODE.MANUAL,
      intituleMetierVise: "Pâtissier",
      codeRome: "M18",
    });
    await submit(result.current.form);

    act(() =>
      result.current.form.setValue(FUTUR_METIER_FIELD.METIER_VISE_ENTRY_MODE, ENTRY_MODE.SEARCH),
    );

    expect(result.current.progress.errorCount).toBe(0);
    expect(result.current.voletErrors).toEqual([]);
  });

  it("compte les entreprises contactées dans les perspectives d'emploi après un « oui » aux contacts (maquette 16)", () => {
    const result = renderForm();
    setValues(result.current.form, { ...FILLED_TEXTS, metierVise: BOULANGER });

    setValues(result.current.form, { contactEmployeurs: OUI_NON.OUI });
    expect(result.current.sections[FUTUR_METIER_SECTION.PERSPECTIVES_EMPLOI]).toEqual({
      remainingFieldCount: 1,
      errorCount: 0,
    });

    setValues(result.current.form, { entreprisesContactees: "Studio Okami" });
    expect(result.current.progress.remainingFieldCount).toBe(0);
  });

  it("à l'envoi après un « oui » aux contacts, liste les entreprises contactées à la fin du résumé", async () => {
    const result = renderForm();
    setValues(result.current.form, {
      ...FILLED_TEXTS,
      metierVise: BOULANGER,
      contactEmployeurs: OUI_NON.OUI,
    });

    await submit(result.current.form);

    expect(result.current.sections[FUTUR_METIER_SECTION.PERSPECTIVES_EMPLOI].errorCount).toBe(1);
    expect(result.current.voletErrors).toEqual([
      {
        fieldId: "entreprisesContactees",
        message: "Veuillez indiquer les entreprises contactées ou rencontrées.",
      },
    ]);
  });

  it("ne compte plus l'erreur des entreprises contactées après un retour à « non »", async () => {
    const result = renderForm();
    setValues(result.current.form, {
      ...FILLED_TEXTS,
      metierVise: BOULANGER,
      contactEmployeurs: OUI_NON.OUI,
    });
    await submit(result.current.form);

    act(() => result.current.form.setValue(FUTUR_METIER_FIELD.CONTACT_EMPLOYEURS, OUI_NON.NON));

    expect(result.current.progress.errorCount).toBe(0);
    expect(result.current.voletErrors).toEqual([]);
  });
});
