import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { InsetPanel, INSET_PANEL_VARIANT } from "@etape/ui/components/inset-panel";

afterEach(cleanup);

const classSet = (element: Element | null | undefined): Set<string> =>
  new Set(element?.className.split(" "));

describe("InsetPanel", () => {
  it("garde le retrait, le filet et le rembourrage par défaut", () => {
    const { container } = render(<InsetPanel>Contenu</InsetPanel>);

    const root = container.firstElementChild;
    expect(root?.getAttribute("data-slot")).toBe("inset-panel");
    expect(root?.className).toBe("ps-5");
    expect(classSet(root?.firstElementChild)).toEqual(
      new Set([
        "bg-secondary",
        "flex",
        "flex-col",
        "border-l-primary",
        "gap-4",
        "rounded-r-md",
        "border-l-3",
        "px-5",
        "py-4",
      ]),
    );
  });

  it.each([
    [INSET_PANEL_VARIANT.PLAIN, ["gap-3", "px-4", "py-3"]],
    [INSET_PANEL_VARIANT.COMPACT, ["gap-2", "px-3", "py-2"]],
  ])("se rend en un seul bloc, sans filet ni retrait, en variante %s", (variant, spacing) => {
    const { container } = render(
      <InsetPanel variant={variant} id="encart">
        Contenu
      </InsetPanel>,
    );

    const root = container.firstElementChild;
    expect(root?.getAttribute("data-slot")).toBe("inset-panel");
    expect(root?.id).toBe("encart");
    expect(classSet(root)).toEqual(
      new Set(["bg-secondary", "flex", "flex-col", "rounded-md", ...spacing]),
    );
    expect(root?.textContent).toBe("Contenu");
  });
});
