import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Button } from "@etape/ui/components/button";

afterEach(cleanup);

function classesOf(label: string): string[] {
  return [...screen.getByRole("button", { name: label }).classList];
}

describe("Button multiline", () => {
  it("garde par défaut la hauteur du kit et son libellé sur une ligne", () => {
    render(
      <Button variant="link" size="lg">
        Rechercher
      </Button>,
    );

    const classes = classesOf("Rechercher");
    expect(classes).toContain("h-12");
    expect(classes).toContain("whitespace-nowrap");
    expect(classes).not.toContain("whitespace-normal");
  });

  it("laisse le libellé passer à la ligne, avec la hauteur du kit pour minimum", () => {
    render(
      <Button variant="link" size="lg" multiline>
        Rechercher
      </Button>,
    );

    const classes = classesOf("Rechercher");
    expect(classes).toContain("whitespace-normal");
    expect(classes).toContain("text-left");
    expect(classes).toContain("h-auto");
    expect(classes).toContain("min-h-12");
    expect(classes).not.toContain("h-12");
    expect(classes).not.toContain("whitespace-nowrap");
  });

  it.each([
    ["sm", "min-h-8"],
    ["default", "min-h-10"],
    ["lg", "min-h-12"],
  ] as const)("prend en taille %s le minimum %s", (size, minHeight) => {
    render(
      <Button size={size} multiline>
        Rechercher
      </Button>,
    );

    expect(classesOf("Rechercher")).toContain(minHeight);
  });

  it("ne pose pas d'attribut multiline sur le bouton", () => {
    render(<Button multiline>Rechercher</Button>);

    expect(screen.getByRole("button", { name: "Rechercher" }).hasAttribute("multiline")).toBe(
      false,
    );
  });
});
