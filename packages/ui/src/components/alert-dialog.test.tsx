import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
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

  it("prend la taille de la fenêtre du front-office, avec un corps entre l'en-tête et le pied", () => {
    render(
      <AlertDialog open>
        <AlertDialogContent size="md">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer votre démarche</AlertDialogTitle>
            <AlertDialogDescription>La démarche suivante sera supprimée.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogBody>Démarche 1</AlertDialogBody>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );

    const dialog = screen.getByRole("alertdialog", { name: "Supprimer votre démarche" });
    expect(dialog.getAttribute("data-size")).toBe("md");
    expect(dialog.querySelector("[data-slot=alert-dialog-body]")?.textContent).toBe("Démarche 1");
  });
});
