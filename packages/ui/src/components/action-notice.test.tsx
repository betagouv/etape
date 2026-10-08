import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ActionNotice } from "@etape/ui/components/action-notice";

afterEach(cleanup);

const PROPS = {
  title: "La connexion n'a pas abouti",
  message: "Le service de connexion est momentanément indisponible.",
  actionLabel: "Réessayer",
};

describe("ActionNotice", () => {
  it("affiche le titre, le message et l'action", () => {
    render(<ActionNotice {...PROPS} onAction={vi.fn()} />);

    expect(screen.getByText(PROPS.title)).not.toBeNull();
    expect(screen.getByText(PROPS.message)).not.toBeNull();
    expect(screen.getByRole("button", { name: PROPS.actionLabel })).not.toBeNull();
  });

  it("relance le parcours seulement au clic", () => {
    const onAction = vi.fn();
    render(<ActionNotice {...PROPS} onAction={onAction} />);

    expect(onAction).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: PROPS.actionLabel }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("porte le h1 de la page quand on le lui demande", () => {
    render(<ActionNotice {...PROPS} titleAs="h1" onAction={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 1, name: PROPS.title })).not.toBeNull();
  });

  it("masque l'icône aux lecteurs d'écran", () => {
    const { container } = render(<ActionNotice {...PROPS} onAction={vi.fn()} />);

    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });
});
