// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PieceJustificative } from "../domain/piece-justificative";
import { usePiecesJustificatives } from "./use-pieces-justificatives";

afterEach(cleanup);

const MO = 1_000_000;

function createFichier(name: string, size: number): File {
  const fichier = new File([], name);
  Object.defineProperty(fichier, "size", { value: size });
  return fichier;
}

const ATTESTATION: PieceJustificative = {
  id: "attestation",
  fichier: createFichier("attestation.pdf", MO),
  dateDepot: new Date(2026, 8, 24),
};

function renderField(pieces: readonly PieceJustificative[] = []) {
  const onChange = vi.fn<(pieces: PieceJustificative[]) => void>();
  const { result } = renderHook(() => usePiecesJustificatives(pieces, onChange));
  return { result, onChange };
}

describe("usePiecesJustificatives", () => {
  it("ajoute les fichiers acceptés aux pièces du champ, datés du jour, et l'annonce", () => {
    const { result, onChange } = renderField([ATTESTATION]);
    const compteRendu = createFichier("compte-rendu.docx", 2 * MO);

    act(() => result.current.addFichiers([compteRendu]));

    const [pieces] = onChange.mock.calls[0] ?? [];
    expect(pieces).toHaveLength(2);
    expect(pieces?.[0]).toBe(ATTESTATION);
    expect(pieces?.[1]?.fichier).toBe(compteRendu);
    expect(pieces?.[1]?.dateDepot).toBeInstanceOf(Date);
    expect(pieces?.[1]?.id).not.toBe("");
    expect(result.current.rejections).toEqual([]);
    expect(result.current.announcement).toBe("compte-rendu.docx ajouté.");
  });

  it("affiche et annonce un fichier refusé, sans toucher aux pièces", () => {
    const { result, onChange } = renderField();

    act(() => result.current.addFichiers([createFichier("photo.heic", MO)]));

    expect(onChange).not.toHaveBeenCalled();
    expect(result.current.rejections.map(({ name, reason }) => [name, reason])).toEqual([
      ["photo.heic", "format"],
    ]);
    expect(result.current.announcement).toContain("photo.heic refusé : Ce format");
  });

  it("remplace les refus du précédent ajout", () => {
    const { result } = renderField();
    act(() => result.current.addFichiers([createFichier("photo.heic", MO)]));

    act(() => result.current.addFichiers([createFichier("a.pdf", MO)]));

    expect(result.current.rejections).toEqual([]);
  });

  it("retire une pièce, l'annonce et rend le focus au bouton d'ajout", () => {
    const { result, onChange } = renderField([ATTESTATION]);
    const button = document.createElement("button");
    document.body.append(button);
    result.current.triggerRef.current = button;

    act(() => result.current.removePiece(ATTESTATION));

    expect(onChange).toHaveBeenCalledExactlyOnceWith([]);
    expect(result.current.announcement).toBe("attestation.pdf retiré.");
    expect(document.activeElement).toBe(button);
    button.remove();
  });

  it("ferme le message d'un refus et rend le focus au bouton d'ajout", () => {
    const { result } = renderField();
    const button = document.createElement("button");
    document.body.append(button);
    result.current.triggerRef.current = button;
    act(() =>
      result.current.addFichiers([createFichier("photo.heic", MO), createFichier("b.mov", MO)]),
    );
    const [first] = result.current.rejections;

    act(() => result.current.dismissRejection(first?.id ?? ""));

    expect(result.current.rejections.map(({ name }) => name)).toEqual(["b.mov"]);
    expect(document.activeElement).toBe(button);
    button.remove();
  });
});
