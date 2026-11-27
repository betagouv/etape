// @vitest-environment jsdom
import type { Certification } from "@etape/api-contract";
import { act, cleanup, renderHook } from "@testing-library/react";
import { addDays } from "date-fns";
import { afterEach, describe, expect, it } from "vitest";

import { ENTRY_MODE } from "../../domain/entry-mode";
import { formatFieldDate } from "../../domain/field-date";
import { MODALITE_FORMATION } from "../domain/modalite-formation";
import { FORMATION_SECTION, type FormationFormData } from "../schema";
import { useFormationForm, type UseFormationFormResult } from "./use-formation-form";

afterEach(cleanup);

const CAP_BOULANGER: Certification = {
  numeroFiche: "RNCP12345",
  repertoire: "RNCP",
  intitule: "Boulanger",
  abrege: "CAP",
  niveau: 3,
  certificateurs: [{ siret: "11004301500012", nom: "Ministère de l’Éducation nationale" }],
};

/** Tout est rempli sauf le diplôme. */
const FILLED_WITHOUT_CERTIFICATION: Partial<FormationFormData> = {
  intituleFormation: "CAP Boulanger en un an",
  dureeFormation: "800",
  heuresParSemaine: "35",
  dateDebutFormation: formatFieldDate(addDays(new Date(), 30)),
  dateFinFormation: formatFieldDate(addDays(new Date(), 365)),
  modalitesFormation: [MODALITE_FORMATION.PRESENTIEL],
  contenuFormation: "Technologie, pratique professionnelle, hygiène et sécurité.",
};

type Form = UseFormationFormResult["form"];

function renderForm(): { current: UseFormationFormResult } {
  return renderHook(() => useFormationForm()).result;
}

function setValues(form: Form, values: Partial<FormationFormData>): void {
  act(() => {
    form.reset({ ...form.getValues(), ...values });
  });
}

async function submit(form: Form): Promise<void> {
  await act(async () => {
    await form.handleSubmit(() => undefined)();
  });
}

describe("useFormationForm", () => {
  it("demande huit champs quand rien n'est saisi, comme la maquette", () => {
    const result = renderForm();

    expect(result.current.progress).toEqual({
      requiredFieldCount: 8,
      filledFieldCount: 0,
      remainingFieldCount: 8,
      errorCount: 0,
    });
    expect(result.current.sections).toEqual({
      [FORMATION_SECTION.FORMATION]: { remainingFieldCount: 8, errorCount: 0 },
    });
    expect(result.current.voletErrors).toEqual([]);
  });

  it("ne laisse que le diplôme à choisir, puis plus rien une fois choisi", () => {
    const result = renderForm();

    setValues(result.current.form, FILLED_WITHOUT_CERTIFICATION);
    expect(result.current.progress.remainingFieldCount).toBe(1);

    setValues(result.current.form, { certificationVisee: CAP_BOULANGER });
    expect(result.current.progress.remainingFieldCount).toBe(0);
  });

  it("en saisie manuelle, ne compte que l'intitulé du diplôme, pas le code ni le niveau", () => {
    const result = renderForm();

    setValues(result.current.form, {
      ...FILLED_WITHOUT_CERTIFICATION,
      certificationViseeEntryMode: ENTRY_MODE.MANUAL,
      intituleCertificationVisee: "CAP Boulanger",
    });

    expect(result.current.progress.requiredFieldCount).toBe(8);
    expect(result.current.progress.remainingFieldCount).toBe(0);
  });

  it("liste les erreurs du volet après un envoi, diplôme compris", async () => {
    const result = renderForm();

    await submit(result.current.form);

    expect(result.current.voletErrors.map(({ fieldId }) => fieldId)).toEqual([
      "intituleFormation",
      "certificationVisee",
      "dureeFormation",
      "heuresParSemaine",
      "dateDebutFormation",
      "dateFinFormation",
      "modalitesFormation",
      "contenuFormation",
    ]);
  });
});
