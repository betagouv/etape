import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  Card,
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
