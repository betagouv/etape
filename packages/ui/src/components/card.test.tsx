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
});
