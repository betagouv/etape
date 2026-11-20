import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConfirmationDialog } from "@etape/ui/components/confirmation-dialog";

afterEach(cleanup);

interface RemovalProps {
  onCancel?: () => void;
  onConfirm?: () => void;
  onCloseFocus?: () => void;
}

/** Une suppression à confirmer, ouverte d'emblée et refermée par l'écran, comme dans une app. */
function Removal({ onCancel, onConfirm, onCloseFocus = () => undefined }: RemovalProps) {
  const [isOpen, setOpen] = useState(true);
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      title="Supprimer votre document"
      description="Le document suivant sera supprimé de votre dossier."
      cancel={{
        label: "Garder",
        onClick: () => {
          onCancel?.();
          setOpen(false);
        },
      }}
      confirm={{
        label: "Supprimer le document",
        isDestructive: true,
        onClick: () => {
          onConfirm?.();
          setOpen(false);
        },
      }}
      onCloseFocus={onCloseFocus}
    >
      <p>attestation.pdf</p>
    </ConfirmationDialog>
  );
}

describe("ConfirmationDialog", () => {
  it("affiche le titre, le texte, le contenu et les libellés que l'écran lui donne", () => {
    render(<Removal />);

    const dialog = screen.getByRole("alertdialog", { name: "Supprimer votre document" });
    expect(dialog.getAttribute("data-size")).toBe("md");
    expect(screen.getByText("Le document suivant sera supprimé de votre dossier.")).toBeTruthy();
    expect(dialog.querySelector("[data-slot=alert-dialog-body]")?.textContent).toBe(
      "attestation.pdf",
    );
    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual([
      "Garder",
      "Supprimer le document",
    ]);
  });

  it("donne le focus au bouton d'annulation", () => {
    render(<Removal />);

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Garder" }));
  });

  it("confirme sans annuler, puis laisse l'écran placer le focus", async () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    const onCloseFocus = vi.fn();
    render(<Removal onCancel={onCancel} onConfirm={onConfirm} onCloseFocus={onCloseFocus} />);

    fireEvent.click(screen.getByRole("button", { name: "Supprimer le document" }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).toBeNull();
    await waitFor(() => expect(onCloseFocus).toHaveBeenCalledOnce());
  });

  it("annule par son bouton comme par Échap", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    const { unmount } = render(<Removal onCancel={onCancel} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Garder" }));
    expect(onCancel).toHaveBeenCalledOnce();
    unmount();

    render(<Removal onCancel={onCancel} onConfirm={onConfirm} />);
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });

    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("se passe de contenu entre le texte et les boutons", () => {
    render(
      <ConfirmationDialog
        isOpen
        title="Quitter ?"
        description="Vos réponses sont conservées."
        cancel={{ label: "Rester", onClick: vi.fn() }}
        confirm={{ label: "Quitter", onClick: vi.fn() }}
        onCloseFocus={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("alertdialog").querySelector("[data-slot=alert-dialog-body]"),
    ).toBeNull();
  });
});
