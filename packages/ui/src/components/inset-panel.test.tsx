import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { InsetPanel, INSET_PANEL_VARIANT } from "@etape/ui/components/inset-panel";

afterEach(cleanup);

describe("InsetPanel", () => {
  it("garde le retrait et le filet par défaut", () => {
    const { container } = render(<InsetPanel>Contenu</InsetPanel>);

    const root = container.firstElementChild;
    expect(root?.getAttribute("data-slot")).toBe("inset-panel");
    expect(root?.className).toBe("ps-5");
    expect(root?.firstElementChild?.className).toContain("border-l-primary");
  });

  it("se rend en un seul bloc, sans filet ni retrait, en variante plain", () => {
    const { container } = render(
      <InsetPanel variant={INSET_PANEL_VARIANT.PLAIN} id="encart">
        Contenu
      </InsetPanel>,
    );

    const root = container.firstElementChild;
    expect(root?.getAttribute("data-slot")).toBe("inset-panel");
    expect(root?.id).toBe("encart");
    expect(root?.className).not.toContain("border-l-primary");
    expect(root?.className).toContain("rounded-md");
    expect(root?.textContent).toBe("Contenu");
  });
});
