import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SessionDialog, type SessionDialogProps } from "@etape/ui/components/session-dialog";

afterEach(cleanup);

const PROPS: SessionDialogProps = {
  open: true,
  title: "Êtes-vous toujours là ?",
  message: "Sans réponse de votre part, votre session expirera dans 2 minutes.",
  actionLabel: "Oui",
  action: { onClick: vi.fn(), isBusy: false, failureMessage: "" },
};

describe("SessionDialog", () => {
  it("n'affiche rien tant qu'il est fermé", () => {
    render(<SessionDialog {...PROPS} open={false} />);

    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("s'annonce comme une alerte nommée par son titre et sa description", () => {
    render(<SessionDialog {...PROPS} />);

    const dialog = screen.getByRole("alertdialog", { name: PROPS.title });

    expect(dialog.getAttribute("aria-describedby")).toBe(screen.getByText(PROPS.message).id);
  });

  it("place le focus sur l'action à l'ouverture", () => {
    render(<SessionDialog {...PROPS} />);

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Oui" }));
  });

  it("reste ouvert sur Échap", () => {
    render(<SessionDialog {...PROPS} />);

    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });

    expect(screen.queryByRole("alertdialog")).not.toBeNull();
  });

  it("rend le focus à l'élément qui l'avait, une fois fermé", async () => {
    const { rerender } = render(
      <>
        <input aria-label="Nom" />
        <SessionDialog {...PROPS} open={false} />
      </>,
    );
    const field = screen.getByRole("textbox", { name: "Nom" });
    field.focus();

    rerender(
      <>
        <input aria-label="Nom" />
        <SessionDialog {...PROPS} />
      </>,
    );
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Oui" }));

    rerender(
      <>
        <input aria-label="Nom" />
        <SessionDialog {...PROPS} open={false} />
      </>,
    );

    await waitFor(() => expect(document.activeElement).toBe(field));
  });

  describe("action dans la page", () => {
    it("appelle onClick au clic", () => {
      const onClick = vi.fn();
      render(<SessionDialog {...PROPS} action={{ onClick, isBusy: false, failureMessage: "" }} />);

      fireEvent.click(screen.getByRole("button", { name: "Oui" }));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("pendant l'envoi, garde le focus et ignore un nouveau clic", () => {
      const onClick = vi.fn();
      render(<SessionDialog {...PROPS} action={{ onClick, isBusy: true, failureMessage: "" }} />);
      const button = screen.getByRole("button", { name: "Oui" });

      fireEvent.click(button);

      expect(onClick).not.toHaveBeenCalled();
      expect(button.hasAttribute("disabled")).toBe(false);
      expect(button.getAttribute("aria-disabled")).toBe("true");
      expect(document.activeElement).toBe(button);
    });

    it("annonce son échec dans le dialogue, par une région montée avec lui", () => {
      const { rerender } = render(<SessionDialog {...PROPS} />);
      const region = screen.getByRole("status");

      expect(region.textContent).toBe("");

      rerender(
        <SessionDialog
          {...PROPS}
          action={{
            onClick: vi.fn(),
            isBusy: false,
            failureMessage: "La prolongation n'a pas abouti.",
          }}
        />,
      );

      expect(screen.getByRole("status")).toBe(region);
      expect(region.textContent).toBe("La prolongation n'a pas abouti.");
    });
  });

  describe("action qui quitte l'app", () => {
    it("est un lien, focalisé à l'ouverture", () => {
      render(
        <SessionDialog
          {...PROPS}
          title="Votre session a expiré"
          actionLabel="Se reconnecter"
          action={{ href: "/api/auth/login?returnTo=%2F" }}
        />,
      );

      const link = screen.getByRole("link", { name: "Se reconnecter" });

      expect(link.getAttribute("href")).toBe("/api/auth/login?returnTo=%2F");
      expect(document.activeElement).toBe(link);
    });
  });
});
