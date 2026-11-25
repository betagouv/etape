// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { PieceJustificative } from "../../domain/piece-justificative";
import { DOCUMENTS_FIELD, DOCUMENTS_SECTION } from "../schema";
import { useDocumentsForm } from "./use-documents-form";

afterEach(cleanup);

const PROGRAMME: PieceJustificative = {
  id: "programme",
  fichier: new File(["x"], "programme.pdf"),
  dateDepot: new Date(2026, 10, 25),
};

describe("useDocumentsForm", () => {
  it("part d'un dossier neuf : 3 documents restants", () => {
    const { result } = renderHook(() => useDocumentsForm());

    expect(result.current.progress).toEqual({
      requiredFieldCount: 3,
      filledFieldCount: 0,
      remainingFieldCount: 3,
      errorCount: 0,
    });
    expect(result.current.sections[DOCUMENTS_SECTION.OBLIGATOIRES]).toEqual({
      remainingFieldCount: 3,
      errorCount: 0,
    });
  });

  it("suit le dépôt d'une pièce dans l'avancement et le compteur", () => {
    const { result } = renderHook(() => useDocumentsForm());

    act(() => result.current.form.setValue(DOCUMENTS_FIELD.PROGRAMME_FORMATION, [PROGRAMME]));

    expect(result.current.progress.remainingFieldCount).toBe(2);
    expect(result.current.sections[DOCUMENTS_SECTION.OBLIGATOIRES].remainingFieldCount).toBe(2);
  });

  it("décrit le statut du volet après un dépôt, d'après les valeurs en cours", () => {
    const { result } = renderHook(() => useDocumentsForm());

    expect(
      result.current.describeStatutChange(DOCUMENTS_FIELD.CALENDRIER_FORMATION, [PROGRAMME]),
    ).toBe("Mes documents : 2 documents restants à déposer.");

    act(() => result.current.form.setValue(DOCUMENTS_FIELD.CALENDRIER_FORMATION, [PROGRAMME]));

    expect(
      result.current.describeStatutChange(DOCUMENTS_FIELD.CALENDRIER_FORMATION, [
        PROGRAMME,
        PROGRAMME,
      ]),
    ).toBe("");
  });
});
