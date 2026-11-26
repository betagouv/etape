import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FormSectionTitle } from "@etape/ui/components/form-section";

afterEach(cleanup);

const classSet = (element: Element | null | undefined): Set<string> =>
  new Set(element?.className.split(" "));

describe("FormSectionTitle", () => {
  it("garde par défaut un h3 de 18 px, sur des lignes de 24 px, la hauteur de l'en-tête", () => {
    const { container } = render(<FormSectionTitle>Identité</FormSectionTitle>);

    const title = container.firstElementChild;
    expect(title?.tagName).toBe("H3");
    expect(classSet(title)).toEqual(new Set(["font-semibold", "text-lg", "leading-6"]));
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

  it("donne au sous-titre d'un groupe 16 px sur une ligne de 24, dans la couleur principale", () => {
    const { container } = render(
      <FormSectionTitle size="subtitle" asChild>
        <h4>Les démarches en lien avec votre projet</h4>
      </FormSectionTitle>,
    );

    const title = container.firstElementChild;
    expect(title?.tagName).toBe("H4");
    expect(classSet(title)).toEqual(
      new Set(["font-semibold", "text-base", "leading-6", "text-primary"]),
    );
  });
});
