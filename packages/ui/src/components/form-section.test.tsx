import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FormSectionTitle } from "@etape/ui/components/form-section";

afterEach(cleanup);

const classSet = (element: Element | null | undefined): Set<string> =>
  new Set(element?.className.split(" "));

describe("FormSectionTitle", () => {
  it("garde un h3 de 18 px sans hauteur de ligne par défaut", () => {
    const { container } = render(<FormSectionTitle>Identité</FormSectionTitle>);

    const title = container.firstElementChild;
    expect(title?.tagName).toBe("H3");
    expect(classSet(title)).toEqual(new Set(["font-semibold", "text-lg", "leading-none"]));
  });

  it("prend le niveau de son enfant et la taille sm", () => {
    const { container } = render(
      <FormSectionTitle size="sm" asChild>
        <h2>Vos informations</h2>
      </FormSectionTitle>,
    );

    const title = container.firstElementChild;
    expect(title?.tagName).toBe("H2");
    expect(title?.getAttribute("data-slot")).toBe("form-section-title");
    expect(classSet(title)).toEqual(new Set(["font-semibold", "text-base", "leading-none"]));
  });
});
