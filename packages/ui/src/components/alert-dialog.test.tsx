import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@etape/ui/components/alert-dialog";

afterEach(cleanup);

function renderConfirmation(onConfirm = vi.fn()) {
  render(
    <AlertDialog>
      <AlertDialogTrigger>Quitter</AlertDialogTrigger>
      <AlertDialogContent placement="top-end">
        <AlertDialogHeader>
          <AlertDialogTitle>Voulez-vous vraiment quitter ?</AlertDialogTitle>
          <AlertDialogDescription>Vos réponses sont conservées.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction variant="destructive-subdued" onClick={onConfirm}>
            Confirmer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>,
  );
}

describe("AlertDialog", () => {
  it("s'ouvre depuis son déclencheur, nommé par son titre", () => {
    renderConfirmation();

    fireEvent.click(screen.getByRole("button", { name: "Quitter" }));

    const dialog = screen.getByRole("alertdialog", { name: "Voulez-vous vraiment quitter ?" });
    expect(dialog.getAttribute("data-placement")).toBe("top-end");
  });

  it("donne le focus à « Annuler », le choix sans conséquence", () => {
    renderConfirmation();

    fireEvent.click(screen.getByRole("button", { name: "Quitter" }));

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Annuler" }));
  });

  it("se ferme sur « Annuler » et rend le focus au déclencheur", async () => {
    renderConfirmation();
    const trigger = screen.getByRole("button", { name: "Quitter" });

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(screen.queryByRole("alertdialog")).toBeNull();
    // Radix rend le focus au tour suivant de la boucle d'événements.
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("appelle l'action confirmée puis se ferme", () => {
    const onConfirm = vi.fn();
    renderConfirmation(onConfirm);

    fireEvent.click(screen.getByRole("button", { name: "Quitter" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmer" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
});
