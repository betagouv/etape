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

  it("garde les refus affichés quand un dépôt n'apporte aucun fichier", () => {
    const { result, onChange } = renderField();
    act(() => result.current.addFichiers([createFichier("photo.heic", MO)]));
    const announcement = result.current.announcement;

    act(() => result.current.addFichiers([]));

    expect(onChange).not.toHaveBeenCalled();
    expect(result.current.rejections).toHaveLength(1);
    expect(result.current.announcement).toBe(announcement);
  });

  it("redit le même ajout fait deux fois de suite", () => {
    const { result } = renderField();
    act(() => result.current.addFichiers([createFichier("a.pdf", MO)]));
    const first = result.current.announcement;

    act(() => result.current.addFichiers([createFichier("a.pdf", MO)]));

    expect(result.current.announcement).not.toBe(first);
    expect(result.current.announcement.trim()).toBe(first);
  });

  it("remplace les refus du précédent ajout", () => {
    const { result } = renderField();
    act(() => result.current.addFichiers([createFichier("photo.heic", MO)]));

    act(() => result.current.addFichiers([createFichier("a.pdf", MO)]));

    expect(result.current.rejections).toEqual([]);
  });

  it("demande confirmation avant de retirer une pièce, et porte le focus sur « Annuler »", () => {
    const { result, onChange } = renderField([ATTESTATION]);
    const cancel = document.createElement("button");
    document.body.append(cancel);
    result.current.cancelRemovalRef.current = cancel;

    act(() => result.current.askRemoval(ATTESTATION));

    expect(result.current.pendingRemovalId).toBe(ATTESTATION.id);
    expect(onChange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(cancel);
    cancel.remove();
  });

  it("garde la pièce quand on annule, et rend le focus à sa corbeille", () => {
    const { result, onChange } = renderField([ATTESTATION]);
    const corbeille = document.createElement("button");
    document.body.append(corbeille);
    act(() => result.current.askRemoval(ATTESTATION));
    result.current.registerRemoveButton(ATTESTATION.id)(corbeille);

    act(() => result.current.cancelRemoval());

    expect(result.current.pendingRemovalId).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(corbeille);
    corbeille.remove();
  });

  it("retire la pièce confirmée, l'annonce et rend le focus au bouton d'ajout", () => {
    const { result, onChange } = renderField([ATTESTATION]);
    const button = document.createElement("button");
    document.body.append(button);
    result.current.triggerRef.current = button;
    act(() => result.current.askRemoval(ATTESTATION));

    act(() => result.current.confirmRemoval());

    expect(onChange).toHaveBeenCalledExactlyOnceWith([]);
    expect(result.current.pendingRemovalId).toBeNull();
    expect(result.current.announcement).toBe("attestation.pdf retiré.");
    expect(document.activeElement).toBe(button);
    button.remove();
  });

  it("remplace la confirmation en attente quand on demande à supprimer une autre pièce", () => {
    const COMPTE_RENDU: PieceJustificative = { ...ATTESTATION, id: "compte-rendu" };
    const { result, onChange } = renderField([ATTESTATION, COMPTE_RENDU]);
    act(() => result.current.askRemoval(ATTESTATION));

    act(() => result.current.askRemoval(COMPTE_RENDU));
    act(() => result.current.confirmRemoval());

    expect(onChange).toHaveBeenCalledExactlyOnceWith([ATTESTATION]);
  });

  it("ne retire rien quand la pièce à confirmer a déjà disparu", () => {
    const onChange = vi.fn<(pieces: PieceJustificative[]) => void>();
    const { result, rerender } = renderHook(
      ({ pieces }: { pieces: readonly PieceJustificative[] }) =>
        usePiecesJustificatives(pieces, onChange),
      { initialProps: { pieces: [ATTESTATION] } },
    );
    act(() => result.current.askRemoval(ATTESTATION));
    rerender({ pieces: [] });

    act(() => result.current.confirmRemoval());

    expect(onChange).not.toHaveBeenCalled();
    expect(result.current.pendingRemovalId).toBeNull();
    expect(result.current.announcement).toBe("");
  });

  it("ajoute à l'annonce ce que le changement fait ailleurs, à l'ajout comme au retrait", () => {
    const onChange = vi.fn<(pieces: PieceJustificative[]) => void>();
    const describeChange = vi.fn((pieces: readonly PieceJustificative[]) =>
      pieces.length > 0 ? "Mes documents : complet." : "Mes documents : 1 document à déposer.",
    );
    const { result, rerender } = renderHook(
      ({ pieces }: { pieces: readonly PieceJustificative[] }) =>
        usePiecesJustificatives(pieces, onChange, describeChange),
      { initialProps: { pieces: [] as readonly PieceJustificative[] } },
    );

    act(() => result.current.addFichiers([ATTESTATION.fichier]));
    expect(result.current.announcement).toBe("attestation.pdf ajouté. Mes documents : complet.");

    rerender({ pieces: [ATTESTATION] });
    act(() => result.current.askRemoval(ATTESTATION));
    act(() => result.current.confirmRemoval());
    expect(result.current.announcement).toBe(
      "attestation.pdf retiré. Mes documents : 1 document à déposer.",
    );
  });

  it("n'ajoute rien à l'annonce d'un ajout entièrement refusé", () => {
    const onChange = vi.fn<(pieces: PieceJustificative[]) => void>();
    const describeChange = vi.fn(() => "Mes documents : complet.");
    const { result } = renderHook(() => usePiecesJustificatives([], onChange, describeChange));

    act(() => result.current.addFichiers([createFichier("photo.heic", MO)]));

    expect(describeChange).not.toHaveBeenCalled();
    expect(result.current.announcement).not.toContain("Mes documents");
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
