import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  Card,
  CardDescription,
  CardDetail,
  CardDetailLabel,
  CardDetails,
  CardDetailValue,
  CardTitle,
  CardTitleValue,
} from "@etape/ui/components/card";

afterEach(cleanup);

describe("Card", () => {
  it("laisse à l'écran le niveau de titre de la carte", () => {
    render(
      <Card variant="secondary">
        <CardTitle asChild>
          <h4>CARREFOUR</h4>
        </CardTitle>
      </Card>,
    );

    const title = screen.getByRole("heading", { level: 4, name: "CARREFOUR" });
    expect(title.getAttribute("data-slot")).toBe("card-title");
  });

  it("garde, en carte de saisie, le titre et le texte d'introduction dans leurs emplacements", () => {
    render(
      <Card variant="form">
        <CardTitle asChild>
          <h4>Démarche 1</h4>
        </CardTitle>
        <CardDescription>Vous pourrez déposer vos comptes-rendus.</CardDescription>
      </Card>,
    );

    const title = screen.getByRole("heading", { level: 4, name: "Démarche 1" });
    expect(title.closest("[data-slot=card]")?.getAttribute("data-variant")).toBe("form");
    expect(
      screen.getByText("Vous pourrez déposer vos comptes-rendus.").getAttribute("data-slot"),
    ).toBe("card-description");
  });

  it("expose les lignes « libellé / valeur » comme une liste de description", () => {
    render(
      <Card variant="secondary">
        <CardDetails>
          <CardDetail>
            <CardDetailLabel>SIRET</CardDetailLabel>
            <CardDetailValue>652 014 051 00732</CardDetailValue>
          </CardDetail>
        </CardDetails>
      </Card>,
    );

    expect(screen.getByRole("term").textContent).toBe("SIRET");
    expect(screen.getByRole("definition").textContent).toBe("652 014 051 00732");
  });

  it("porte dans le titre lui-même la taille et la couleur de son type de carte", () => {
    render(
      <Card variant="secondary">
        <CardTitle variant="label" asChild>
          <h4>
            Démarche 1 : <CardTitleValue>Salon</CardTitleValue>
          </h4>
        </CardTitle>
        <CardTitle variant="summary">CARREFOUR</CardTitle>
        <CardTitle>Par défaut</CardTitle>
      </Card>,
    );

    const label = screen.getByRole("heading", { level: 4 });
    expect(label.className).toContain("text-sm");
    expect(label.className).toContain("font-medium");
    expect(screen.getByText("Salon").getAttribute("data-slot")).toBe("card-title-value");
    expect(screen.getByText("CARREFOUR").className).toContain("text-base");
    expect(screen.getByText("Par défaut").className).toBe("leading-none font-semibold");
  });

  it("pose le libellé d'une ligne au-dessus de sa valeur, à la demande", () => {
    render(
      <CardDetails>
        <CardDetail orientation="vertical">
          <CardDetailLabel>Apport</CardDetailLabel>
          <CardDetailValue>Un texte long.</CardDetailValue>
        </CardDetail>
        <CardDetail>
          <CardDetailLabel>SIRET</CardDetailLabel>
          <CardDetailValue>652 014 051 00732</CardDetailValue>
        </CardDetail>
      </CardDetails>,
    );

    const [vertical, horizontal] = screen
      .getAllByRole("term")
      .map((term) => term.closest("[data-slot=card-detail]"));
    expect(vertical?.getAttribute("data-orientation")).toBe("vertical");
    expect(vertical?.className).toContain("flex-col");
    expect(horizontal?.getAttribute("data-orientation")).toBe("horizontal");
    expect(horizontal?.className).toContain("justify-between");
  });
});
