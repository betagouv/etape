import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SessionExpiredDialog } from "@etape/ui/components/session-expired-dialog";

afterEach(cleanup);

describe("SessionExpiredDialog", () => {
  it("n'affiche rien tant que la session n'a pas expiré", () => {
    render(<SessionExpiredDialog open={false} onReconnect={vi.fn()} />);

    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("s'annonce comme une alerte nommée par son titre et sa description", () => {
    render(<SessionExpiredDialog open onReconnect={vi.fn()} />);

    const dialog = screen.getByRole("alertdialog", { name: "Votre session a expiré" });

    expect(dialog.getAttribute("aria-describedby")).toBe(
      screen.getByText("Reconnectez-vous pour continuer.").id,
    );
  });

  it("place le focus sur « Se reconnecter » à l'ouverture", () => {
    render(<SessionExpiredDialog open onReconnect={vi.fn()} />);

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Se reconnecter" }));
  });

  it("appelle onReconnect au clic", () => {
    const onReconnect = vi.fn();
    render(<SessionExpiredDialog open onReconnect={onReconnect} />);

    fireEvent.click(screen.getByRole("button", { name: "Se reconnecter" }));

    expect(onReconnect).toHaveBeenCalledTimes(1);
  });

  it("reste ouvert sur Échap", () => {
    render(<SessionExpiredDialog open onReconnect={vi.fn()} />);

    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });

    expect(screen.queryByRole("alertdialog")).not.toBeNull();
  });
});
