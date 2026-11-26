import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Surface } from "@etape/ui/components/surface";

afterEach(cleanup);

describe("Surface", () => {
  it("pose le fond de page et garde la mise en page que l'écran lui ajoute", () => {
    render(
      <Surface surface="page" className="flex-1">
        Contenu
      </Surface>,
    );

    const surface = screen.getByText("Contenu");
    expect(surface.getAttribute("data-slot")).toBe("surface");
    expect(surface.getAttribute("data-surface")).toBe("page");
    expect(surface.className).toBe("bg-surface-page flex-1");
  });
});
