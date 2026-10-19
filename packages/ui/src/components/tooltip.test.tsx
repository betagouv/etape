import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@etape/ui/components/tooltip";

// Le positionnement de Radix mesure le déclencheur ; jsdom n'a pas de ResizeObserver.
beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    },
  );
});

afterEach(cleanup);

function renderTooltips() {
  render(
    <TooltipProvider>
      {["Outil", "Dispositif"].map((label) => (
        <Tooltip key={label}>
          <TooltipTrigger>{label}</TooltipTrigger>
          <TooltipContent>Définition {label}</TooltipContent>
        </Tooltip>
      ))}
    </TooltipProvider>,
  );
}

function tap(element: HTMLElement) {
  fireEvent.pointerDown(element, { pointerType: "touch" });
  fireEvent.pointerUp(element, { pointerType: "touch" });
  fireEvent.click(element);
}

describe("Tooltip", () => {
  it("s'ouvre au focus clavier et se ferme avec Échap", () => {
    renderTooltips();
    const trigger = screen.getByRole("button", { name: "Outil" });

    fireEvent.focus(trigger);
    expect(screen.getByRole("tooltip")).toHaveProperty("textContent", "Définition Outil");
    expect(trigger.getAttribute("aria-describedby")).toBe(screen.getByRole("tooltip").id);

    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("s'ouvre et se ferme à l'appui, que Radix ignore seul", () => {
    renderTooltips();
    const trigger = screen.getByRole("button", { name: "Dispositif" });

    tap(trigger);
    expect(screen.getByRole("tooltip")).toHaveProperty("textContent", "Définition Dispositif");

    tap(trigger);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("se ferme au clic de la souris qui l'a ouvert au survol", async () => {
    renderTooltips();
    const trigger = screen.getByRole("button", { name: "Outil" });

    fireEvent.pointerMove(trigger, { pointerType: "mouse" });
    expect(await screen.findByRole("tooltip")).not.toBeNull();

    fireEvent.pointerDown(trigger, { pointerType: "mouse" });
    fireEvent.click(trigger);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("bascule avec Entrée ou Espace, sans pointerdown", () => {
    renderTooltips();
    const trigger = screen.getByRole("button", { name: "Outil" });

    fireEvent.click(trigger);
    expect(screen.queryByRole("tooltip")).not.toBeNull();

    fireEvent.click(trigger);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("n'a qu'un tooltip ouvert à la fois", () => {
    renderTooltips();

    tap(screen.getByRole("button", { name: "Outil" }));
    tap(screen.getByRole("button", { name: "Dispositif" }));

    const tooltips = screen.getAllByRole("tooltip");
    expect(tooltips).toHaveLength(1);
    expect(tooltips[0]).toHaveProperty("textContent", "Définition Dispositif");
  });
});
