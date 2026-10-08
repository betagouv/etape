import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NoticeScreen } from "@etape/ui/components/notice-screen";

afterEach(cleanup);

const PROPS = {
  title: "Le service est momentanément indisponible",
  message: "Veuillez réessayer dans quelques minutes.",
  actionLabel: "Réessayer",
};

describe("NoticeScreen", () => {
  it("porte le contenu principal et le h1 de la page", () => {
    render(<NoticeScreen {...PROPS} onAction={vi.fn()} />);

    expect(screen.getByRole("main")).not.toBeNull();
    expect(screen.getByRole("heading", { level: 1, name: PROPS.title })).not.toBeNull();
  });

  it("appelle onAction au clic", () => {
    const onAction = vi.fn();
    render(<NoticeScreen {...PROPS} onAction={onAction} />);

    fireEvent.click(screen.getByRole("button", { name: PROPS.actionLabel }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
